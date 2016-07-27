

module.exports = function(options){
    var fs = require('fs'),
        path = require('path'),
        _ = require('lodash'),
        util = require('util'),


        configPath = path.resolve(process.cwd(), './dp-ftp-config.json'),
        configStr = fs.readFileSync(configPath, { encoding: 'utf8' }),
        config = _.extend({}, JSON.parse(configStr), options);

    this.defaults = {
        secure: false,
        port: 21,
        secureOptions: {
            rejectUnauthorized: false,
            secureProtocol: 'TLSv1_method'
        }
    };

    this.ignore = config.ignore || ["**/node_modules/**/*"];

    this.uploadOnly = config.uploadOnly || false;

    this.paths = {
        local: config.local,
        remote: config.remote
    };

    this.ftp = _.extend({}, this.defaults, config);

    this.DEBUG_LOW = !!(config.DEBUG_HIGH || config.DEBUG_MED || config.DEBUG_LOW);
    this.DEBUG_MED = !!(config.DEBUG_HIGH || config.DEBUG_MED);
    this.DEBUG_HIGH = !!(config.DEBUG_HIGH);

    this.debug = function() {
        console.log.apply(console, arguments);
    };

    return this;
};
