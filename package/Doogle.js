(function($module) {

    "use strict";

    /**
     * @property $scope
     * @type {Doogle}
     */
    var $scope;

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
     * @module Doogle
     * @constructor
     */
    var Doogle = function Doogle(uri) {
        this._uri = uri;
    };

    /**
     * @property prototype
     * @type {Object}
     */
    Doogle.prototype = {

        /**
         * @property uri
         * @type {String}
         * @private
         */
        _uri: null,

        /**
         * @property path
         * @type {String}
         * @private
         */
        _path: null,

        /**
         * @property _file
         * @type {String}
         */
        _file: null,

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
         * @property _timeStarted
         * @type {Number}
         */
        _timeStarted: 0,

        /**
         * @property _promises
         * @type {Object}
         * Object containing the promises to ease the flow.
         */
        _promises: {

            /**
             * @property phantom
             * @type {Q}
             * Promise for the majority of the PhantomJS callback hell.
             */
            phantom: $q.defer(),

            /**
             * @property response
             * @type {Q}
             * Promise that is the last to be resolved with the data.
             */
            response: $q.defer(),

            /**
             * @property statistics
             * @type {Q}
             * Promise for the attempt to retrieve the file from the cache.
             */
            statistics: $q.defer()

        },

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
            $cursor.hex('#553c45').bg.hex('#e7a3bd').write(' Doogle: ').reset().write(' ' + message + "\n");
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
         * @method _sendResponse
         * @param fromCache {Boolean}
         * Responsible for sending the data via the promise.
         * @return {void}
         * @private
         */
        _sendResponse: function _sendResponse(fromCache) {

            $scope._promises.response.resolve({

                // Resolve the ultimate promise and continue on our merry way.
                name            : $scope._file,
                cache           : !!fromCache,
                responseTime    : (new Date().getTime() - this._startTime)

            });

        },

        /**
         * @method fetch
         * @param [path = "/"] {String}
         * @return {Q.promise}
         */
        fetch: function fetch(path) {

            // Reset all of the promises.
            var promises        = $scope._promises;
            promises.phantom    = $q.defer();
            promises.response   = $q.defer();
            promises.statistics = $q.defer();

            // Memorise the time we started this process.
            $scope._startTime = new Date().getTime();

            // Define the path of the output file.
            var uri         = $scope._path = $util.format('%s/%s', this._uri, path || ''),
                sha1        = $crypto.createHash('sha1').update(uri),
                filename    = sha1.digest('hex');

            // Memorise the file.
            $scope._file = $util.format('%s.html', filename);

            // First attempt to find the cached version.
            $scope._retrieveCache().then(function() {

                // We've found the cached version, so let's respond!
                $scope._sendResponse(true);

            }).fail(function() {

                $scope._bootstrapPhantom().then(function() {

                    // We've retrieved the content and saved it to the cache file, therefore
                    // we can respond!
                    $scope._sendResponse(false);

                }).fail(function(message) {

                    // Promise rejected and therefore we'll reject the overall promise.
                    $scope.throwError(message);
                    $scope._promises.response.reject();

                });

            });

            return $scope._promises.response.promise;

        },

        /**
         * @method _retrieveCache
         * Responsible for attempting to get the item from the cache.
         * @return {Q.promise}
         * @private
         */
        _retrieveCache: function _retrieveCache() {

            var defer       = $scope._promises.statistics,
                location    = $util.format('%s/%s', $scope._directory, $scope._file);

            // Check if we can return the cached version instead.
            $fs.stat(location, function stat(error, stats) {

                if (error) {
                    defer.reject();
                    return;
                }

                var now     = $moment(new Date().getTime()),
                    created = $moment(stats.ctime),
                    diff    = created.diff(now, 'hours');

                if (diff > $scope._expiry) {
                    defer.reject();
                    return;
                }

                defer.resolve();

            });

            return defer.promise;

        },

        /**
         * @method _bootstrapPhantom
         * Responsible for dealing with all the seemingly unnecessary and complex callbacks
         * that PhantomJS forces us to go through.
         * @return {Q.promise}
         * @private
         */
        _bootstrapPhantom: function _bootstrapPhantom() {

            var defer = $scope._promises.phantom;

            try {

                $phantom.create(function create(error, phantom) {

                    if (error) {
                        throw error;
                    }

                    phantom.createPage(function createPage(error, page) {

                        if (error) {
                            throw error;
                        }

                        page.open($scope._path, function openPage(error) {

                            if (error) {
                                throw error;
                            }

                            page.evaluate(function evaluatePage() {

                                // Fetch the whole HTML of the document.
                                return document.documentElement.innerHTML;

                            }, function evaluateResponse(error, result) {

                                if (error) {
                                    throw error;
                                }

                                var location = $util.format('%s/%s', $scope._directory, $scope._file);

                                $fs.writeFile(location, result, function() {

                                    // Resolve the promise because we have the file at last!
                                    defer.resolve();

                                    phantom.exit();

                                });

                            });

                        });

                    });

                });

            } catch (e) {

                defer.reject(e);

            }

            return defer.promise;

        }

    };

    $module.exports = function(uri) {
        $scope = new Doogle(uri);
        return $scope;
    };

})(module);