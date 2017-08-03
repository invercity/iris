const path = require('path'),
  mongoose = require('mongoose'),
  async = require('async'),
  Order = mongoose.model('Order'),
  Client = mongoose.model('Client'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.create = (req, res) => {
  const {
    items,
    place,
    placeDescription,
    date,
    status,
    sale,
    credit,
    total,
  } = req.body;
  const orderData = {
    items,
    place,
    placeDescription,
    date,
    status,
    sale,
    credit,
    total,
  };
  const clientData = req.body.client;

  async.parallel([
    (callback) => {
      if (!clientData._id) {
        const client = new Client(clientData);
        client.save((err) => {
          if (err) {
            callback(err);
          }
          else {
            callback(null, client._id);
          }
        });
      }
      else {
        callback(null, clientData._id);
      }
    }
  ], (err, [client]) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      orderData.client = client;
      const order = new Order(orderData);
      order.user = req.user;

      order.save((err) => {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(order);
        }
      });
    }
  });
};

exports.read = (req, res) => {
  res.json(req.order);
};

exports.update = (req, res) => {
  const { order } = req;
  const {
    items,
    place,
    placeDescription,
    payed,
    status,
    sale,
    credit,
    total,
  } = req.body;

  order.items = items;
  order.place = place;
  order.placeDescription = placeDescription;
  order.payed = payed;
  order.status = status;
  order.sale = sale;
  order.credit = credit;
  order.total = total;

  order.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(order);
    }
  });
};

exports.delete = (req, res) => {
  const { order } = req;

  order.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(order);
    }
  });
};

exports.list = (req, res) => {
  const { payed, place, status } = req.query;
  const search =
    typeof payed === 'undefined' &&
    typeof place === 'undefined' &&
    typeof status === 'undefined' ? undefined : {};
  if (search) {
    if (payed) search.payed = payed;
    if (place) search.place = place;
    if (status) search.status = status;
  }
  Order.find(search)
    .sort('-created')
    .select('-items')
    .populate('user', 'displayName')
    .populate('client')
    .populate('place', 'name')
    .exec((err, orders) => {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(orders);
      }
    });
};

exports.orderByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Order is invalid'
    });
  }

  Order.findById(id)
    .populate('user', 'displayName')
    .populate('client')
    .populate('items.good')
    .populate('place')
    .exec((err, order) => {
      if (err) {
        return next(err);
      } else if (!order) {
        return res.status(404).send({
          message: 'No order with that identifier has been found'
        });
      }
      req.order = order;
      next();
    });
};
