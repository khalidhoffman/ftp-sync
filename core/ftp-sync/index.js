var path = require('path'),
    fs = require('fs'),

    moment = require('moment'),
    async = require('async'),
    _ = require('lodash'),
    Backbone = require('backbone'),

    dump = require('../lib/dump');

module.exports = Backbone.Model.extend({

    initialize: function (options) {
        this.ftp = options.client || options.ftp;
        this.debug = options.debug;
        if (!this.ftp) throw new Error('ftp client not provided');
    },

    /**
     *
     * @param {String} localFilePath
     * @param {String} remoteFilePath
     * @param {Function} callback
     * @param {Object} [options]
     * @param {Boolean} [options.uploadOnly]
     * @param {Object} [options.context]
     */
    sync: function (localFilePath, remoteFilePath, callback, options) {
        var self = this,
            _options = _.extend({
                debug: self.debug
            }, options),
            remoteModificationDate = false,
            localModificationDate = false,
            pathsMeta = {
                local: localFilePath,
                remote: remoteFilePath
            };

        if (self.debug) console.log("syncing '%s' && '%s'", localFilePath, remoteFilePath);

        async.eachOf(pathsMeta,
            function each(path, index, done) {
                switch (index) {
                    case 'local':
                        fs.stat(pathsMeta.local, function (err, stat) {
                            if (err) {
                                done(err);
                            } else {
                                localModificationDate = moment(stat.mtime);
                                if (self.debug) console.log("local modification date: %s", localModificationDate.format("dddd, MMMM Do YYYY, h:mm:ss a"));
                                done();
                            }
                        });
                        break;
                    case 'remote':
                        self.ftp.list(pathsMeta.remote, function (err, info) {
                            if (err) {
                                done(err);
                            } else {
                                // console.log('remote stat: %s', dump(info));
                                var fileExists = (info.length > 0);
                                remoteModificationDate = (fileExists) ? moment(info[0].date) : false;
                                if (self.debug) console.log("remote modification date: %s", remoteModificationDate.format("dddd, MMMM Do YYYY, h:mm:ss a"));
                                done();
                            }

                        });
                        break;
                    default:
                        done(new Error("file not listed as remote||local"))
                }
            },
            function onComplete(err) {
                if (err) throw err;

                if ((localModificationDate && !remoteModificationDate) || _options.uploadOnly) {
                    self.uploadFile(pathsMeta.local, pathsMeta.remote, {debug: _options.debug}, function (err) {
                        if (callback) callback.call(_options.context, err);
                    });
                } else if (localModificationDate && remoteModificationDate) {
                    // compare file modification dates
                    var fileTimeDiff = remoteModificationDate.diff(localModificationDate);
                    if (_options.debug) console.log('[remote]\'%s\' is %s', pathsMeta.remote, ((remoteModificationDate.diff(localModificationDate) >= 0) ? 'newer' : 'older'));
                    if (fileTimeDiff > 0) {
                        // remote file is newer
                        self.downloadFile(pathsMeta.remote, pathsMeta.local, {debug: _options.debug}, function (err) {
                            if (callback) callback.call(_options.context, err);
                        });
                    } else if (fileTimeDiff === 0) {
                        // assume to be replicas
                        noop(function () {
                            if (callback) callback.call(_options.context);
                        });
                    } else {
                        // remote file is older
                        self.uploadFile(pathsMeta.local, pathsMeta.remote, {debug: _options.debug}, function (err) {
                            if (callback) callback.call(_options.context, err);
                        });
                    }
                } else {
                    // quit
                    console.error('failed to sync files ["%s", "%s"]', pathsMeta.local, pathsMeta.remote);
                    if (callback) callback.call()
                }
            })


    },

    /**
     *
     * @param {Object} [options]
     * @param {Boolean} [options.debug]
     * @param {Function} callback
     */
    noop: function (options, callback) {
        var _options = _.extend({
            debug: false,
            callback: callback
        }, _.isFunction(options) ? {callback: options} : options);
        if (_options.debug) console.log("no-op");
        if (_options.callback) _options.callback.apply(_options.context, _options.args);
    },

    /**
     *
     * @param {String} src
     * @param {String} dest
     * @param {Object} [options]
     * @param {Boolean} [options.debug]
     * @param {Function} callback
     */
    uploadFile: function (src, dest, options, callback) {
        var self = this,
            _options = _.extend({
                debug: true,
                callback: callback
            }, _.isFunction(options) ? {callback: options} : options);
        if (_options.debug) console.log("uploading '%s' -> '%s'", src, dest);
        this.ftp.mkdir(path.dirname(dest), true, function (err) {
            if (err) console.error(err);
            self.ftp.put(src, dest, function (err) {
                if (_options.callback) _options.callback.apply(_options.context, [err, src, dest]);
            });
        });
    },

    /**
     *
     * @param {String} src
     * @param {String} dest
     * @param {Object} [options]
     * @param {Boolean} [options.debug]
     * @param {Function} callback
     */
    downloadFile: function (src, dest, options, callback) {
        var self = this,
            _options = _.extend({
                debug: true,
                callback: callback
            }, _.isFunction(options) ? {callback: options} : options);
        if (_options.debug) console.log("downloading '%s' -> '%s'", src, dest);
        this.ftp.list(src, function (err, fileMeta) {
            if (err) throw err;
            var remoteModificationDate = moment(fileMeta['date']).toDate();
            self.ftp.get(src, function (err, fileStream) {
                if (err && _options.callback) return _options.callback.apply(_options.context, [err, src, dest]);
                var content = '';
                fileStream.on('data', function (data) {
                    content += data;
                });
                fileStream.on('end', function () {
                    self.saveLocal(dest, content, function (err, path) {
                        self.setDate(dest, remoteModificationDate, function (syncError) {
                            if (_options.callback) _options.callback.apply(_options.context, [syncError, src, dest]);
                        })
                    })
                })
            });
        });

    },

    /**
     *
     * @param {String} path
     * @param {String} content
     * @param {Object} [options]
     * @param {Boolean} [options.debug]
     * @param {Function} callback
     */
    saveLocal: function (path, content, options, callback) {
        var _options = _.extend({
            debug: false,
            callback: callback
        }, _.isFunction(options) ? {callback: options} : options);
        fs.writeFile(path, content, {encoding: 'utf8'}, function (err) {
            if (_options.callback) _options.callback.apply(_options.context, [err, path, content, options]);
        });
    },

    /**
     *
     * @param {String} path
     * @param {Date} date
     * @param {Object} [options]
     * @param {Object} [callback]
     */
    setDate: function (path, date, options, callback) {
        var _options = _.extend({
            debug: false,
            callback: callback
        }, _.isFunction(options) ? {callback: options} : options);
        fs.utimes(path, new Date(), date, function (err) {
            if (_options.callback) _options.callback.apply(_options.context, [err, path, date, options]);
        });
    }
});