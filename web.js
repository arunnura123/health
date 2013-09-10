#!/usr/bin/env node
var  express = require('express')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
var counter=0;
var app = express();
var pg = require('pg')
var conf=process.env.DATABASE_URL;
var io = require('socket.io').listen(app);
app.set('port', process.env.PORT || 8080);

app.configure(function(){
app.use(express.bodyParser());
app.use(app.router);
  
});


http.createServer(app).listen(app.get('port'), function() {
    counter+=1;
      console.log("Listening on " + app.get('port'));
  });

var usernames = {};

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});

app.post('/', function (request, response) {
 var data = fs.readFileSync('Infof.html').toString();
 var bdata = fs.readFileSync('infob.html').toString();
 var wStrin  =  request.body.sel;
 var ipAddress;
 var forwardedIpsStr = request.header('x-forwarded-for');
  if (forwardedIpsStr) {
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
   
    ipAddress = request.connection.remoteAddress;
  }

var  dat="http://freegeoip.net/json/"+ ipAddress;
var  obj='';
var mdat='';
var min='';
    http.get(dat, function(res) {
    res.on('data', function (chunk){
    mdat+=chunk;
      } );
      res.on('end',function(){
      obj = JSON.parse(mdat);
      mdat=obj.city;    
       pg.connect(conf, function(err, client, done) {
 if(err) return console.error(err);
      if(!wStrin)
      { 
      client.query("SELECT DISTINCT * FROM health where district ='" + mdat + "' ", function(err, result) {
      for (var i = 0; i < result.rows.length; i++) {
                var row = result.rows[i];
                data+= "[";
                data+= "'" + row.district + "'" + ",";
                data+="'" + row.hname+ "'" + ",";
                data+="'" + row.pinno +"'" + "," ;
                data+="'" + row.pno + "'" + "]" + "," ;
            } 
      done(); 
      data+=bdata;
      response.send(data);  
});
}

      var i=0;
      mdat = wStrin.slice(0,4);
      mdat+='0';
      min = wStrin.slice(0,4);
      min+='9'; 
      client.query("SELECT DISTINCT * FROM health where pinno >= '" + mdat + "'  AND  pinno  <= '" + min + "'", function(err, result) {
      for (var i = 0; i < result.rows.length; i++) {
                var row = result.rows[i];
                data+= "[";
                data+= "'" + row.district + "'" + ",";
                data+="'" + row.hname+ "'" + ",";
                data+="'" + row.pinno +"'" + "," ;
                data+="'" + row.pno + "'" + "]" + "," ;
            }
           done();
	data+=bdata;
	response.send(data);   
      });
});
});
});
});

app.get('/', function (request, response) {
 var bdata = fs.readFileSync('index.html').toString();
 response.send(bdata);
});
