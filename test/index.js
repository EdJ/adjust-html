require('chai').should();

var MemoryStream = require('memorystream');

var adjustHead = require('../lib');

var request = require('request');

var http = require('http');
var connect = require('connect');

var runServer = function runServer(adjustHead, handler) {
    var app = connect();

    app.use(adjustHead);
    app.use(handler);

    var port = 9091;

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

describe('adjust-head', function() {
    describe('Only HTML content should be adjusted.', function() {
        it('should not adjust non-HTML.', function(done) {
            var expectedResponse = 'Some plain text.';
            var handler = function(request, response) {
                response.end(expectedResponse);
            };

            var middleware = adjustHead({
                content: 'Some content or other'
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });

        it('should not adjust HTML sent without the text/html content type.', function(done) {
            var expectedResponse = '<html><head></head><body></body></html>';
            var handler = function(request, response) {
                response.end(expectedResponse);
            };

            var middleware = adjustHead({
                content: 'Some content'
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });
    });

    describe('Appending to the HEAD', function() {
        it('should append to the HEAD when sent HTML.', function(done) {
            var responseText = '<html><head>I was here first</head></html>';
            var content = 'Test!';
            var expectedResponse = '<html><head>I was here firstTest!</head></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });

        it('should append to the HEAD when given a function.', function(done) {
            var responseText = '<html><head>I was here first</head></html>';
            var content = function () {
                return 'Test!'
            };

            var expectedResponse = '<html><head>I was here firstTest!</head></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });

        it('should append to the HEAD when given a function with a callback.', function(done) {
            var responseText = '<html><head>I was here first</head></html>';
            var content = function (callback) {
                callback(null, 'Test!');
            };

            var expectedResponse = '<html><head>I was here firstTest!</head></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });

        it('should append to a stream.', function(done) {
            var responseText = '<html><head>This should stay</head></html>';
            var content = 'Some other test..';
            var expectedResponse = '<html><head>This should staySome other test..</head></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                var output = new MemoryStream();
                output.pipe(response);

                output.write(responseText);
                output.end('');
            };

            var middleware = adjustHead({
                content: content
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });
    });

    describe('Prepending to the HEAD', function() {
        it('should prepend to the HEAD when specified.', function(done) {
            var responseText = '<html><head>I was here first</head></html>';
            var content = 'But this will be there first';
            var expectedResponse = '<html><head>But this will be there firstI was here first</head></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content,
                prepend: true
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });
    });

    describe('Adjusting via CSS selector.', function() {
        it('should append to the BODY when specified.', function(done) {
            var responseText = '<html><head>I was here first</head><body>Not here</body></html>';
            var content = 'So I will add this to the body.';
            var expectedResponse = '<html><head>I was here first</head><body>Not hereSo I will add this to the body.</body></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content,
                prepend: false,
                element: 'body'
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });

        it('should only adjust the first instance of a selector.', function(done) {
            var responseText = '<html><head></head><body><ul><li>a</li><li>b</li></ul></body></html>';
            var content = '!';

            // Does not write multiple times.
            var expectedResponse = '<html><head></head><body><ul><li>!a</li><li>b</li></ul></body></html>';

            var handler = function(request, response) {
                response.setHeader('Content-Type', 'text/html');

                response.end(responseText);
            };

            var middleware = adjustHead({
                content: content,
                prepend: true,
                element: 'li'
            });

            var server = runServer(middleware, handler);

            server.request(function(err, response, body) {
                body.should.equal(expectedResponse);

                server.close(function() {
                    done();
                });
            });
        });
    });
});

