#!/usr/bin/env node

var fs = require('fs'),
    path = require('path');

fs.readFile(path.resolve(__dirname, '../ftp.example.config'), {encoding:'utf8'}, function(err, str){
    if (err) throw err;
    fs.writeFile(path.resolve(process.cwd(), 'ftp.config'), str, function(err){
        if(err) throw err;
    });
});