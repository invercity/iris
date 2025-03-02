const path = require('path');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.read = (req, res) => {
  res.json(req.model);
};

exports.update = async (req, res) => {
  const user = req.model;

  //For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;

  return user
      .save()
      .exec()
      .then(() => {
        res.json(user);
      })
      .catch((err) => {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      });
};

exports.delete = async (req, res) => {
  const user = req.model;

  return user
      .remove()
      .exec()
      .then(() => {
          return res.json(user);
      })
      .catch((err) => {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      });
};

/**
 * List of Users
 */
exports.list = async (req, res) => {
  return User
      .find({}, '-salt -password')
      .sort('-created')
      .populate('user', 'displayName')
      .exec()
      .then((users) => {
        return res.json(users);
      })
      .catch(err => res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      }));
};

/**
 * User middleware
 */
exports.userByID = async (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  return User
      .findById(id, '-salt -password')
      .exec()
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'User not found'
          });
        }
        req.model = user;
        next();
      })
      .catch(err => next(err));
};
