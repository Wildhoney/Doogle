(function($module) {

    // Lovely little dependencies...
    var $phantom    = require('node-phantom'),
        $fs         = require('fs'),
        $util       = require('util'),
        $crypto     = require('crypto');

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
         * @method fetch
         * @param [path = "/"] {String}
         * @return {void}
         */
        fetch: function fetch(path) {

            // Define the path of the output file.
            var uri         = $util.format('%s/%s', this._uri, path || ''),
                sha1        = $crypto.createHash('sha1').update(uri),
                filename    = sha1.digest('hex'),
                location    = $util.format('%s/%s.html', this._directory, filename);

            $phantom.create(function create(error, phantom) {

                return phantom.createPage(function(error, page) {

                    page.open(uri, function openPage(error, status) {

                        page.evaluate(function evaluatePage() {

                            return document.documentElement.innerHTML;

                        }, function evaluateResponse(error, result) {

                            $fs.writeFile(location, result, function writeFile(error) {
                                phantom.exit();
                            });

                        });

                    });

                });

            });

//            page.open(url, function (status) {
//                //Page is loaded!
//                console.log(status);
//                phantom.exit();
//            });


        }

    };

    $module.exports = function(uri) {
        return new Similo(uri);
    };

})(module);