#!/usr/bin/env node

var FTPSyncer = require('../index'),
    syncer = new FTPSyncer();

syncer.start();