const mongoose = require('mongoose');
const chalk = require('chalk');

const config = require('../config');
const { get, clone } = require('../lib/util');

// global seed options object
let seedOptions = {};

function removeUser (user) {
  return new Promise((resolve, reject) => {
    const User = mongoose.model('User');
    // TODO: IRS-6
    User.find({ username: user.username }).remove((err)=> {
      if (err) {
        reject(new Error('Failed to remove local ' + user.username));
      }
      resolve();
    });
  });
}

// TODO: IRS-6
function saveUser (user) {
  return () => {
    return new Promise((resolve, reject) => {
      user.save((err, theuser) => {
        if (err) {
          reject(new Error('Failed to add local ' + user.username));
        } else {
          resolve(theuser);
        }
      });
    });
  };
}

function checkUserNotExists (user) {
  return new Promise((resolve, reject) => {
    const User = mongoose.model('User');
    User.find({ username: user.username }, (err, users) => {
      if (err) {
        reject(new Error('Failed to find local account ' + user.username));
      }

      if (users.length === 0) {
        resolve();
      } else {
        reject(new Error('Failed due to local account already exists: ' + user.username));
      }
    });
  });
}

function reportSuccess (password) {
  return (user) => {
    return new Promise((resolve) => {
      if (seedOptions.logResults) {
        console.log(chalk.bold.red('Database Seeding:\t\t\tLocal ' + user.username + ' added with password set to ' + password));
      }
      resolve();
    });
  };
}

// save the specified user with the password provided from the resolved promise
function seedTheUser (user) {
  return (password) => {
    return new Promise((resolve, reject) => {
      user.password = password;

      if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
        checkUserNotExists(user)
          .then(saveUser(user))
          .then(reportSuccess(password))
          .then(() => resolve())
          .catch(err => reject(err));
      } else {
        removeUser(user)
          .then(saveUser(user))
          .then(reportSuccess(password))
          .then(() => resolve())
          .catch(err => reject(err));
      }
    });
  };
}

// report the error
function reportError (reject) {
  return (err) => {
    if (seedOptions.logResults) {
      console.log();
      console.log('Database Seeding:\t\t\t' + err);
      console.log();
    }
    reject(err);
  };
}

module.exports.start = function start(options) {
  // Initialize the default seed options
  seedOptions = clone(config.seedDB.options);
  if (get(options, 'logResults')) {
    seedOptions.logResults = options.logResults;
  }

  if (get(options, 'seedUser')) {
    seedOptions.seedUser = options.seedUser;
  }

  if (get(options, 'seedAdmin')) {
    seedOptions.seedAdmin = options.seedAdmin;
  }

  const User = mongoose.model('User');
  return new Promise((resolve, reject) => {

    const adminAccount = new User(seedOptions.seedAdmin);
    const userAccount = new User(seedOptions.seedUser);

    //If production only seed admin if it does not exist
    if (process.env.NODE_ENV === 'production') {
      User.generateRandomPassphrase()
        .then(seedTheUser(adminAccount))
        .then(() => resolve())
        .catch(reportError(reject));
    } else {
      // Add both Admin and User account
      User.generateRandomPassphrase()
        .then(seedTheUser(userAccount))
        .then(User.generateRandomPassphrase)
        .then(seedTheUser(adminAccount))
        .then(() => resolve())
        .catch(reportError(reject));
    }
  });
};
