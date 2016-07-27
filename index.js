module.exports = function FTPSyncer(options) {
    var fs = require('fs'),
        util = require('util'),
        path = require('path'),
        url = require('url'),

        _ = require('lodash'),
        FTPClient = require('ftp'),
        glob = require('glob'),
        moment = require('moment'),

        FTPSync = require('./core/ftp-sync'),
        dump = require('./core/lib/dump'),

        ftp = new FTPClient(),
        ftpSync = new FTPSync({client: ftp}),
        config = new require('./core/config')(options),
        ftpOptions = (config.DEBUG_HIGH) ? _.extend({}, config.ftp, {
            debug: config.debug
        }) : config.ftp;


    ftp.on('greeting', function () {
        if (config.DEBUG_LOW) console.log('ftp.greeting(%s)', dump(arguments));
    });

    ftp.on('ready', function () {
        if (config.DEBUG_LOW) console.log('ftp.ready(%s)', dump(arguments));

        ftp.list(config.paths.remote, function (err, list) {
            var localPathData = path.parse(config.paths.local),
                localGlob = (localPathData.ext) ? path.normalize(config.paths.local) : path.join(config.paths.local, '**/*');
            if (err) throw err;
            // console.log('remote glob %s', dump(list));
            // console.log('local glob: ', dump(localGlob));
            glob(localGlob, {
                ignore: config.ignore,
                nodir: true
            }, function (err, files) {
                if (err) throw err;
                if (config.DEBUG_MED) console.log('glob files: %s', dump(files));
                if(files.length === 0) {
                    console.warn("No files to sync found");
                    ftp.end();
                } else {
                    _.forEach(files, function (filename, index, collection) {
                        var localPath = filename,
                            remoteFilePath = path.join(config.paths.remote, path.relative(config.paths.local, localPath));
                        if (config.DEBUG_HIGH) console.log("checking file '%s'", remoteFilePath);

                        ftpSync.sync(localPath, remoteFilePath, function (err) {
                            if (err) console.error('err: %s', dump(err));
                            ftp.end();
                        }, {uploadOnly: config.uploadOnly, debug: config.DEBUG_MED});
                    });
                }
            });
        });
    });

    ftp.on('error', function () {
        if (config.DEBUG_LOW) console.log('ftp.error(%s)', dump(arguments));
    });

    ftp.on('close', function () {
        if (config.DEBUG_LOW) console.log('ftp.close(%s)', dump(arguments));
    });

    ftp.on('end', function () {
        if (config.DEBUG_LOW) console.log('ftp.end(%s)', dump(arguments));
    });

    this.start = function () {
        if (config.DEBUG_LOW) console.log('Connecting with %s', dump(ftpOptions));
        ftp.connect(ftpOptions);
    }
};