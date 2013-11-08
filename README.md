Doogle
=========

<img src="https://travis-ci.org/Wildhoney/Doogle.png?branch=master" />
&nbsp;
<img src="https://badge.fury.io/js/Doogle.png" />

**Teaching an old dog new tricks...**

Google translates any hash-bang URLs (`#!`) it finds into an actual GET parameter `_escaped_fragment_`. By listening for this parameter and querying Doogle, we can generate and cache static HTML pages for your JavaScript content.

For a complete reference on Google's AJAX crawling please see <a href="https://developers.google.com/webmasters/ajax-crawling/docs/getting-started" taregt="_blank">getting started</a>.

Install with npm: `npm install doogle`

<img src="http://farm8.static.flickr.com/7127/7146261335_90627b033e.jpg" />

Getting Started
---------

Doogle is **very** simple to get up and running with. First of all you need to let Doogle know which base URL we're going to be using.

```javascript
var doogle = require('doogle')('http://www.example.com/');
```

Any time you specify a path to retrieve, it will be appended to the base URL (`http://www.example.com/`).

You then need to decide where to store your HTML snapshots, and for how long they're valid for in hours.

```javascript
// Set the HTML snapshot directory.
doogle.setDirectory(__dirname + '/snapshots');

// Set the expiry in hours.
doogle.setExpiry(24);
```

If you don't want to use cache at all &ndash; which isn't recommended, then you can set `setExpiry` to `false`.

You then need to instruct Doogle on which path to fetch.

```javascript
doogle.fetch('/');
```

As `fetch` returns `Q.promise` you need to define what happens when Doogle resolves the promise.

```javascript
doogle.fetch('/').then(function(data) {
    response.send(JSON.stringify(data));
});
```

From there on in you're on your own! Doogle lets you decide how to serve the HTML snapshot to Googlebot.