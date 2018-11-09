'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath));
  });

  if (callback) callback();
};

// Initialize Mongoose
module.exports.connect = function (cb) {
  mongoose.connect(config.db.uri, config.db.options, (err) => {
    // Log Error
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {
      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);
      // Call callback FN
      if (cb) {
        cb(mongoose.connection);
      }
    }
  });
};

module.exports.disconnect = function (cb) {
  mongoose.disconnect(function (err) {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
