var express = require("express"),
    http = require("http");

var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

var port = process.env.PORT || 8080;
server.listen(port);

app.get("/", function (req, res) {
    res.sendfile(__dirname + "/index.html");
});

io.sockets.on("connection", function (socket) {
    socket.emit("from server", { message: "Welcome to Arun's Chat Room!" });
    sendAll({online: Object.keys(socket.manager.open).length});
    bdata="BOT : ";
    socket.on("from client", function (data) {
    console.log("received: ", data, " from ", socket.store.id);
    
    if (data.message)
        sendAll(data, socket.id);
    });
    
    socket.on("disconnect", function(reason) {
        sendAll({online: Object.keys(socket.manager.open).length});
    });
});

function sendAll(message, user) {
    for (var socket in io.sockets.sockets) {
        if (socket != user)
            io.sockets.sockets[socket].emit("from server", message);
    }
}
