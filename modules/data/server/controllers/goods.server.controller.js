const BasicController = require('./basic.server.controller');

class GoodsController extends BasicController {
  constructor() {
    super('Good', {
      fieldNames: [
        'name',
        'count',
        'price',
        'details',
        'type'
      ],
      fieldNamesSearch: [
        'name',
        'details'
      ]
    });
  }
}

module.exports = new GoodsController();

// const mongoose = require('mongoose');
// const Good = mongoose.model('Good');
// const errorHandler = require('../../../core/server/controllers/errors.server.controller');

/* exports.create = (req, res) => {
  const good = new Good(req.body);
  good.user = req.user;

  good.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(good);
    }
  });
};

exports.read = (req, res) => {
  res.json(req.good);
};

exports.update = (req, res) => {
  const { good } = req;

  good.name = req.body.name;
  good.count = req.body.count;
  good.price = req.body.price;
  good.details = req.body.details;
  good.type = req.body.type;

  good.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(good);
    }
  });
};

exports.delete = (req, res) => {
  const { good } = req;

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

exports.list = (req, res) => {
  const { limit, page } = req.query;
  const goods = Good.find()
    .limit(+limit)
    .skip((page - 1) * limit)
    .sort('-created')
    .populate('user', 'displayName');

  const count = Good.count();
  return Promise.props({
    goods, count
  })
    .then(data => res.json(data))
    .catch((err) => {
      console.log(err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

exports.goodByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Good is invalid'
    });
  }

  Good.findById(id).populate('user', 'displayName').exec((err, good) => {
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
*/
