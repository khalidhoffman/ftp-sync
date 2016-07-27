#!/usr/bin/env node

var fs = require('fs'),
    path = require('path');

fs.readFile(path.resolve(__dirname, '../dp-ftp-config.example.json'), {encoding:'utf8'}, function(err, str){
    if (err) throw err;
    fs.writeFile(path.resolve(process.cwd(), 'dp-ftp-config.json'), str, function(err){
        if(err) throw err;
    });
});
