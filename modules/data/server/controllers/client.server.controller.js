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
      ],
      populateFields: [
        'defaultPlace'
      ],
      listExtraQuery: {
        active: true
      }
    });
  }

  async preUpdateHandler(req, item) {
    const updated = await super.preUpdateHandler(req, item);
    updated.active = true;
    if (!updated.defaultPlace) {
      updated.defaultPlace = null;
    }
    return updated;
  }
}

module.exports = new ClientController();

/*
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
  const {
    q = '',
    page = 1,
    limit = 20,
    active = true
  } = req.query;
  const fieldNames = ['firstName', 'lastName', 'phone'];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const $or = fieldNames.map(field => ({ [field]: { $regex: new RegExp(escaped, 'i') } }));
  const items = Client.find({ active, $or })
    .limit(+limit)
    .skip((page - 1) * limit)
    .populate('defaultPlace');

  const count = Client.countDocuments();
  return Promise.props({
    items,
    count
  })
    .then(data => res.json(data))
    .catch((err) => {
      console.log(err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
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

*/
