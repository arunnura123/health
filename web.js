#!/usr/bin/env node
var  express = require('express')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
var counter=0;
var app = express();
var pg = require('pg')
var conf=process.env.DATABASE_URL;

app.set('port', process.env.PORT || 8080);

app.configure(function(){
app.use(express.bodyParser());
app.use(app.router);
  
});


http.createServer(app).listen(app.get('port'), function() {
    counter+=1;
      console.log("Listening on " + app.get('port'));
  });


app.post('/', function (request, response) {
 var data = fs.readFileSync('Infof.html').toString();
 var bdata = fs.readFileSync('infob.html').toString();
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
var mdat='',data='';
    http.get(dat, function(res) {
    res.on('data', function (chunk){
    mdat+=chunk;
      } );
      res.on('end',function(){
      obj = JSON.parse(mdat);
      mdat=obj.city;    
       pg.connect(conf, function(err, client, done) {
 if(err) return console.error(err);
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
