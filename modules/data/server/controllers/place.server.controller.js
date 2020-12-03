const path = require('path'),
  mongoose = require('mongoose'),
  Place = mongoose.model('Place'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.create = (req, res) => {
  const place = new Place(req.body);

  place.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(place);
    }
  });
};

exports.read = (req, res) => {
  res.json(req.place);
};

exports.update = (req, res) => {
  const { place } = req;

  place.name = req.body.name;
  place.address = req.body.address;

  place.save((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(place);
    }
  });
};

exports.delete = (req, res) => {
  const { place } = req;

  place.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(place);
    }
  });
};

exports.list = (req, res) => {
  const {
    q = '',
    page = 1,
    limit = 20
  } = req.query;
  const fieldNames = ['name', 'address'];
  const $or = fieldNames.map(field => ({ [field]: { $regex: new RegExp(q, 'i') } }));
  const items = Place.find({ $or })
    .limit(+limit)
    .skip((page - 1) * limit);
  const count = Place.countDocuments();
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

exports.placeByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Place is invalid'
    });
  }

  Place.findById(id).exec((err, place) => {
    if (err) {
      return next(err);
    } else if (!place) {
      return res.status(404).send({
        message: 'No place with that identifier has been found'
      });
    }
    req.place = place;
    next();
  });
};
