Similo.js
=========

<img src="https://travis-ci.org/Wildhoney/Similo.js.png?branch=master" />
&nbsp;
<img src="https://badge.fury.io/js/similo-js.png" />

Google translates any hash-bang URLs (`#!`) it finds into an actual GET parameter `_escaped_fragment_`. By listening for this parameter and querying Similo, we can generate and cache static HTML pages for your JavaScript content.

For a complete reference on Google's AJAX crawling please see <a href="https://developers.google.com/webmasters/ajax-crawling/docs/getting-started" taregt="_blank">getting started</a>.

Getting Started
---------

Similo is **very** simple to get up and running with. First of all you need to let Similo know which base URL we're going to be using.

```javascript
var similo = require('similo-js')('http://www.example.com/');
```

Any time you specify a path to retrieve, it will be appended to the base URL (`http://www.example.com/`).

You then need to decide where to store your HTML snapshots, and for how long they're valid for in hours.

```javascript
// Set the HTML snapshot directory.
similo.setDirectory(__dirname + '/snapshots');

// Set the expiry in hours.
similo.setExpiry(24);
```

If you don't want to use cache at all &ndash; which isn't recommended, then you can set `setExpiry` to `false`.

You then need to instruct Similo on which path to fetch.

```javascript
similo.fetch('/');
```

As `fetch` returns `Q.promise` you need to define what happens when Similo resolves the promise.

```javascript
similo.fetch('/').then(function(data) {
    response.send(JSON.stringify(data));
});
```

From there on in you're on your own! Similo lets you decide how to serve the HTML snapshot to Googlebot.