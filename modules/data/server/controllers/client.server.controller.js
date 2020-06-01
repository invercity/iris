const path = require('path'),
  mongoose = require('mongoose'),
  Client = mongoose.model('Client'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

const BasicController = require('./basic.server.controller');

class ClientController extends BasicController {
  constructor() {
    super('Client', {
      fieldNames: [
        'firstName',
        'lastName',
        'phone',
        'defaultPlace',
        'active'
      ]
    });
  }
}

exports.create = (req, res) => {
  const client = new Client(req.body);

  client.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(client);
    }
  });
};

exports.read = (req, res) => {
  res.json(req.client);
};

exports.update = (req, res) => {
  const { client } = req;
  const { body: { firstName, lastName, phone, defaultPlace = null } } = req;

  client.firstName = firstName;
  client.lastName = lastName;
  client.phone = phone;
  client.defaultPlace = defaultPlace;
  client.active = true;

  client.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(client);
    }
  });
};

exports.delete = (req, res) => {
  const { client } = req;

  client.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(client);
    }
  });
};

exports.list = (req, res) => {
  Client.find({ active: true })
    .populate('defaultPlace')
    .exec((err, clients) => {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(clients);
      }
    });
};

exports.clientByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Client is invalid'
    });
  }

  Client.findById(id)
    .populate('defaultPlace')
    .exec((err, client) => {
      if (err) {
        return next(err);
      } else if (!client) {
        return res.status(404).send({
          message: 'No client with that identifier has been found'
        });
      }
      req.client = client;
      next();
    });
};
