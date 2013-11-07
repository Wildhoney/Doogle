(function($module) {

    // Lovely little dependencies...
    var $phantom    = require('node-phantom'),
        $fs         = require('fs'),
        $util       = require('util'),
        $crypto     = require('crypto'),
        $q          = require('q'),
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
         * @method fetch
         * @param [path = "/"] {String}
         * @return {Q.promise}
         */
        fetch: function fetch(path) {

            // Define the path of the output file.
            var uri         = $util.format('%s/%s', this._uri, path || ''),
                sha1        = $crypto.createHash('sha1').update(uri),
                filename    = sha1.digest('hex'),
                location    = $util.format('%s/%s.html', this._directory, filename),
                defer       = $q.defer(),
                throwError  = this.throwError.bind(defer);

            $phantom.create(function create(error, phantom) {
                if (error) return throwError(error);

                return phantom.createPage(function createPage(error, page) {
                    if (error) return throwError(error);

                    page.open(uri, function openPage(error, status) {
                        if (error) return throwError(error);

                        page.evaluate(function evaluatePage() {

                            return document.documentElement.innerHTML;

                        }, function evaluateResponse(error, result) {
                            if (error) return throwError(error);

                            $fs.writeFile(location, result, function writeFile(error) {
                                if (error) return throwError(error);

                                // Resolve the promise because we have the file!
                                defer.resolve({
                                    name: $util.format('%s.html', filename)
                                });

                                phantom.exit();
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