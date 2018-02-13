'use strict';
global.Promise = require('bluebird');
var app = require('./config/lib/app');
app.start();
