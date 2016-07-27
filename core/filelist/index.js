var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    Backbone = require('backbone'),

    dump = require('../lib/dump');

module.exports = Backbone.Collection.extend({
    model: require('../file'),
    initialize: function (options) {
        this.on('add', this._onAdd);
        console.log('filelist.initialize(%s)', dump(arguments));
    },
    _onAdd: function (model, collection, event) {
        if (event['add']) {
            // console.log('filelist._onAdd(%s)', dump(arguments));

        } else if (event['remove']) {

        } else if (event['merge']) {

        }
    }

});