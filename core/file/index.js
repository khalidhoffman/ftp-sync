var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
    defaults : {
        filename : null,
        fileDirectory : null,
        filePath : null,
        modificationDate : null
    },
    idAttribute : 'filename',
    initialize : function(){

    }
});

