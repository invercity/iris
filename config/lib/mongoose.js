const chalk = require('chalk');
const path = require('path');
const mongoose = require('mongoose');
const { db, files } = require('../config');

// Load the mongoose models
module.exports.loadModels = () => {
  files.server.models.forEach(modelPath => require(path.resolve(modelPath)));
};

// Initialize Mongoose
module.exports.connect = async () => {
  const { uri, options, debug } = db;
  return mongoose.connect(uri, options)
    .then(() => {
      mongoose.set('debug', debug);
      return mongoose.connection;
    })
    .catch((err) => {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    });
};

module.exports.disconnect = async () => {
  return mongoose.disconnect()
    .then(() => {
      console.info(chalk.yellow('Disconnected from MongoDB.'));
    })
    .catch((err) => {
      console.error(chalk.red('Error when disconnected from MongoDB'));
      console.log(err);
    });
};
