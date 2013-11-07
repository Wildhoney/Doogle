(function($module) {

    // Lovely little dependencies...
    var $phantom    = require('node-phantom'),
        $fs         = require('fs'),
        $util       = require('util'),
        $crypto     = require('crypto'),
        $q          = require('q'),
        $moment     = require('moment'),
        $ansi       = require('ansi'),
        $cursor     = $ansi(process.stdout);

    /**
     * @module Similo
     * @constructor
     */
    var Similo = function Similo(uri) {
        this._uri = uri;
    };

    /**
     * @property prototype
     * @type {Object}
     */
    Similo.prototype = {

        /**
         * @property uri
         * @type {String}
         * @private
         */
        _uri: null,

        /**
         * @property directory
         * @type {String}
         * @private
         */
        _directory: null,

        /**
         * @property _expiry
         * @type {Number}
         * Hours in which the cache file is valid for.
         */
        _expiry: 24,

        /**
         * @method setDirectory
         * @param path {String}
         * @return {void}
         */
        setDirectory: function setDirectory(path) {
            this._directory = path;
        },

        /**
         * @method throwError
         * @param message {String}
         * @return {void}
         */
        throwError: function throwError(message) {
            message = $util.format(" %s\n", message);
            $cursor.hex('#553c45').bg.hex('#e7a3bd').write(' Similo: ').reset().write(' ' + message + "\n");
            this.reject(message);
        },

        /**
         * @method setExpiry
         * @param hours {Number|Boolean}
         */
        setExpiry: function setExpiry(hours) {
            this._expiry = hours;
        },

        /**
         * @method fetch
         * @param [path = "/"] {String}
         * @return {Q.promise}
         */
        fetch: function fetch(path) {

            // Define the path of the output file.
            var startTime   = new Date().getTime(),
                uri         = $util.format('%s/%s', this._uri, path || ''),
                sha1        = $crypto.createHash('sha1').update(uri),
                filename    = sha1.digest('hex'),
                location    = $util.format('%s/%s.html', this._directory, filename),
                defer       = $q.defer(),
                deferStat   = $q.defer(),
                expiry      = this._expiry,
                throwError  = this.throwError.bind(defer),
                $resolve    = function $resolve(fromCache) {

                    defer.resolve({

                        // Resolve the ultimate promise and continue on our merry way.
                        name            : $util.format('%s.html', filename),
                        cache           : fromCache,
                        responseTime    : (new Date().getTime() - startTime)

                    });

                };

            if (expiry === false) {

                // Reject the promise immediately because we don't want to serve cached versions.
                deferStat.reject();

            } else {

                // Check if we can return the cached version instead.
                $fs.stat(location, function stat(error, stats) {

                    var now     = $moment(new Date().getTime()),
                        created = $moment(stats.ctime),
                        diff    = created.diff(now, 'hours');

                    if (diff > expiry) {
                        deferStat.reject();
                        return;
                    }

                    deferStat.resolve();

                });

            }

            // Invoked if the promise for the stats is resolved, and we're simply using the cached version.
            deferStat.promise.then(function() {
                $resolve(true);
            });

            // Invoked if the promise for stats is rejected.
            deferStat.promise.fail(function() {

                $phantom.create(function create(error, phantom) {
                    if (error) return throwError(error);

                    return phantom.createPage(function createPage(error, page) {
                        if (error) return throwError(error);

                        page.open(uri, function openPage(error) {
                            if (error) return throwError(error);

                            page.evaluate(function evaluatePage() {

                                // Fetch the whole HTML of the document.
                                return document.documentElement.innerHTML;

                            }, function evaluateResponse(error, result) {
                                if (error) return throwError(error);

                                $fs.writeFile(location, result, function writeFile(error) {
                                    if (error) return throwError(error);

                                    // Resolve the promise because we have the file!
                                    $resolve(false);

                                    phantom.exit();

                                });

                            });

                        });

                    });

                });

            });

            return defer.promise;

        }

    };

    $module.exports = function(uri) {
        return new Similo(uri);
    };

})(module);