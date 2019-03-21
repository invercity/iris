const { db, files } = require('../config');
const chalk = require('chalk');
const path = require('path');
const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

// Load the mongoose models
module.exports.loadModels = (callback) => {
  files.server.models.forEach(modelPath => require(path.resolve(modelPath)));

  if (callback) {
    callback();
  }
};

// Initialize Mongoose
module.exports.connect = (cb) => {
  const { uri, options, debug } = db;
  console.log('Mongo URI: ', uri);
  console.log('Mongo DB: ', db);
  mongoose.connect(uri, options, (err) => {
    // Log Error
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {
      // Enabling mongoose debug mode if required
      mongoose.set('debug', debug);
      // Call callback FN
      if (cb) {
        cb(mongoose.connection);
      }
    }
  });
};

module.exports.disconnect = (cb) => {
  mongoose.disconnect((err) => {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
