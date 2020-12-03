const path = require('path');
const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Order = mongoose.model('Order');
const Client = mongoose.model('Client');
const { Types } = mongoose;
const errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

const BasicController = require('./basic.server.controller');

class OrderController extends BasicController {
  constructor() {
    super('Order', {
      fieldNames: [
        'items',
        'place',
        'placeDescription',
        'date',
        'status',
        'sale',
        'credit',
        'total',
        'extra'
      ]
    });
  }

  async preCreateHandler(req, item) {
    const { place, client } = req.body;
    client.defaultPlace = place;
    if (!client._id) {
      const newClient = new Client(client);
      await newClient.save();
      item.client = newClient._id;
    } else {
      item.client = client._id;
    }
    if (!item.extra) {
      item.extra = 0;
    }
    return item;
  }

  async preUpdateHandler(req, item) {
    const updatedItem = super.preUpdateHandler(req, item);
    const { client: { _id, phone }, place } = req.body;
    await Client.update({ _id }, { $set: { $set: { phone, defaultPlace: place, active: true } } });
    return updatedItem;
  }
}

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
    extra = 0
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
    extra
  };
  async.parallel([
    (callback) => {
      const clientData = req.body.client;
      clientData.defaultPlace = place;
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
    extra,
    client: {
      phone,
      _id
    }
  } = req.body;

  // TODO: replace with extend
  order.items = items;
  order.place = place;
  order.placeDescription = placeDescription;
  order.payed = payed;
  order.status = status;
  order.sale = sale;
  order.credit = credit;
  order.total = total;
  order.extra = extra;

  order.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // update client phone when updating order
      Client.update({ _id }, { $set: { phone, defaultPlace: place, active: true } }, (err) => {
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
  const {
    q ='',
    payed,
    place,
    status,
    good,
    page = 1,
    limit = 20
  } = req.query;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const search = {
    payed,
    place,
    status
  };
  return Promise.resolve()
    .then(() => {
      if (q) {
        const fields = [
          'firstName',
          'phone',
        ];
        const $or = _.map(fields, field => ({ [field]: { $regex: new RegExp(escaped, 'i') } }));
        return Client.find({ $or })
          .select('_id');
      }
      return null;
    })
    .then((clientIds) => {
      const $or = [];
      if (!isNaN(q) && q) {
        $or.push({ code: +q });
      }
      if (clientIds) {
        $or.push({ client: { $in: clientIds } });
      }
      if (good) {
        $or.push({ 'items.good': { $in: [Types.ObjectId(good)] } });
      }
      if ($or.length) {
        _.extend(search, { $or });
      }
      const params = _.pickBy(search, _.identity);
      const orders = Order.find(params)
        .limit(+limit)
        .skip((page - 1) * limit)
        .sort('-created')
        .populate('user', 'displayName')
        .populate('client')
        .populate('items.good')
        .populate('place');

      const count = Order.count(params);
      return Promise.props({
        orders, count
      });
    })
    .then(data => res.json(data))
    .catch((err) => {
      console.log(err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
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


