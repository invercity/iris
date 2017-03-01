'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Good = mongoose.model('Good'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.create = function (req, res) {
  var good = new Good(req.body);
  good.user = req.user;

  good.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(good);
    }
  });
};

exports.read = function (req, res) {
  res.json(req.good);
};

exports.update = function (req, res) {
  var good = req.good;

  good.name = req.body.name;
  good.count = req.body.count;
  good.price = req.body.price;
  good.details = req.body.details;
  good.type = req.body.type;
  console.log(req.user);

  good.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(good);
    }
  });
};

exports.delete = function (req, res) {
  var good = req.good;

  good.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(good);
    }
  });
};

exports.list = function (req, res) {
  Good.find().sort('-created').populate('user', 'displayName').exec(function (err, goods) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(goods);
    }
  });
};

exports.goodByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Good is invalid'
    });
  }

  Good.findById(id).populate('user', 'displayName').exec(function (err, good) {
    if (err) {
      return next(err);
    } else if (!good) {
      return res.status(404).send({
        message: 'No good with that identifier has been found'
      });
    }
    req.good = good;
    next();
  });
};
