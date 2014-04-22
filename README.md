## adjust-HTML

Adjust HTML, on the fly.

## Overview

Designed to append or prepend script and link tags into the head of a HTML doc,
but can also be used to append them to the body, or generally just append anything
based on a CSS selector.

## Usage

adjust-html is designed to be used as a middleware, so you can drop it straight into your connect/express app:

```
var adjustHtml = require('adjust-html');

app.use(adjustHtml({
    content: '<!-- Add this comment to the HEAD element -->'
});
```

The exposed function to generate the middleware itself takes a number of arguments:

```
var adjustHtml = require('adjust-html');

adjustHtml({
    content: '', // The content to add, no default
    prepend: false, // Whether to add at the beginning or end of the element to adjust, defaults to false
    element: 'head' // Which element to adjust, defaults to head
});
```

Please note that adjust-html will only kick in if the 'Content-Type' header is set to 'text/html'.

## Notes

Adjust-html is slow! Although most files will be effectively a nop, any text/html file will be processed and the processing is quite costly.
Make sure you only use this if you're confident that the outgoing response can be cached, or if you're not too worried about losing a few ms on each call.

You can check performance timings by running ``node perf/test``. Here are some results from my development machine:

```
Over 10000 iterations, on average
Originally took: 0.7464ms
With adjustment took: 13.6274ms
Difference of 12.881ms
```

## License

Copyright (c) 2014 LateRooms.com

Do what you want with the code; No warranty of any kind is given assuming its use.

