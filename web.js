#!/usr/bin/env node
var  express = require('express')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
var counter=0;
var app = express();
app.set('port', process.env.PORT || 8080);

app.configure(function(){
app.use(express.bodyParser());
app.use(app.router);
  
});

app.post('/', function (request, response) {
 var bdata = fs.readFileSync('index.html').toString();
 response.send(bdata);
});
