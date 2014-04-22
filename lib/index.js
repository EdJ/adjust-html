var through = require('through');
var trumpet = require('trumpet');

var _ = require('underscore');

var shouldAdjust = function shouldAdjust(response) {
    var contentType = response.getHeader('Content-Type');

    return contentType == 'text/html';
};

var adjust = function adjust(options) {
    var additional = options.content;
    if (_.isFunction(additional)) {
        if (additional.length) {
           additional(function(err, result) {
                if (!err) {
                    this.emit('data', result);
                }

                this.emit('end');
            }.bind(this));
        } else {
            additional = additional();
        }
    }

    this.emit('data', additional);
};

var createAdjustmentStream = function createAdjustmentStream(options) {
    var hasPrepended = false;

    return through(function write(data) {
        if (!hasPrepended && options.prepend) {
            adjust.call(this, options);
            hasPrepended = true;
        }

        this.emit('data', data);
    }, function end() {
        if (!options.prepend) {
            adjust.call(this, options);
        }

        this.emit('end');
    });
};

var prepare = function(response, actions, options) {
    var adjustmentStream = createAdjustmentStream(options);

    var htmlStream = trumpet();

    var head = htmlStream.select(options.element).createStream();

    head.pipe(adjustmentStream).pipe(head);

    var out = through(actions.write, actions.end);

    htmlStream.pipe(out);

    response.write = htmlStream.write.bind(htmlStream);
    response.end = htmlStream.end.bind(htmlStream);
};

var adjustResponse = function adjustResponse(response, actions, options) {
    if (shouldAdjust(response)) {
        prepare(response, actions, options);
    } else {
        response.write = actions.write;
        response.end = actions.end;
    }
};

module.exports = function adjustHtml(options) {
    options = options || {};

    var content = options.content;
    if (!content) {
        console.log('Did not supply anything to append to the response head.');

        return function nop(request, response, next) {
            next();
        };
    }

    options.element = options.element || 'head';

    return function adjustHtml(request, response, next) {
        var actions = {
            end: response.end.bind(response),
            write: response.write.bind(response)
        };

        response.write = function() {
            adjustResponse(response, actions, options);

            return response.write.apply(response, arguments);
        };

        response.end = function() {
            adjustResponse(response, actions, options);

            return response.end.apply(response, arguments);
        };

        next();
    };
};

