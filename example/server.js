var express         = require('express'),
    app             = express(),
    fileSystem      = require('fs'),
    server          = require('http').createServer(app).listen(8888),
    similo          = require('./../package/Similo.js')('http://www.google.com/');

/**
 * @route /
 */
app.get('/', function(request, response) {

    similo.setDirectory(__dirname + '/snapshots');
    similo.setExpiry(24);

    similo.fetch('/').then(function(data) {
        response.send(JSON.stringify(data));
    });

});