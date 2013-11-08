var express         = require('express'),
    app             = express(),
    server          = require('http').createServer(app).listen(8888),
    doogle          = require('./../package/Doogle.js')('http://www.google.com/');

/**
 * @route /
 */
app.get('/', function(request, response) {

    doogle.setDirectory(__dirname + '/snapshots');
    doogle.setExpiry(24);

    doogle.fetch('/').then(function(data) {
        response.send(JSON.stringify(data));
    });

});