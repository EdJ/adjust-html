require('chai').should();

var MemoryStream = require('memorystream');

var adjustHead = require('../lib');

var request = require('request');

var http = require('http');
var connect = require('connect');

var fs = require('fs');

var runServer = function runServer(adjustHead) {
    var app = connect();

    if (adjustHead) {
        app.use(adjustHead);
    }

    var html = fs.readFileSync(__dirname + '/page.html');

    app.use(function (request, response) {
        response.setHeader('Content-Type', 'text/html');
        response.end(html);
    });

    var port = 9902;

    var server = http.createServer(app).listen(port);

    return {
        request: function(path, callback) {
            if (!callback) {
                callback = path;
                path = '';
            }

            path = path || '';

            request('http://localhost:' + port + path, callback);
        },
        close: server.close.bind(server)
    };
};

var iterations = 10000;

var async = require('async');

var perfTest = function (server, callback) {
    var times = [];

    async.timesSeries(iterations, function (n, next) {
        var t = new Date();

        server.request('/', function (err) {
            if (err) {
                return next(err);
            }

            var elapsed = new Date() - t;

            times.push(elapsed);

            next();
        });
    }, function (err) {
        if (err) {
            return callback(err);
        }

        callback(null, times);
    });
};

var withoutAdjustment = runServer();

var getAverage = function getAverage(arr) {
    return arr.reduce(function (a, b) {
        return a + b;
    }, 0) / arr.length;
};

perfTest(withoutAdjustment, function (err, times) {
    if (err) {
        throw err;
    }

    withoutAdjustment.close();

    var average = getAverage(times);

    console.log('Over ' + iterations + ' iterations, on average');

    console.log('Originally took: ' + average + 'ms');

    var adjustHtml = require('../lib');

    var adjustHead = adjustHtml({
        content: '<!-- Some content to add -->'
    });

    var withAdjustment = runServer(adjustHead);

    perfTest(withAdjustment, function (err, times) {
        if (err) {
            throw err;
        }

        withAdjustment.close();

        var newAverage = getAverage(times);

        console.log('With adjustment took: ' + newAverage + 'ms');

        console.log('Difference of ' + (newAverage - average) + 'ms')
    });
});
