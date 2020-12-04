const mongoose = require('mongoose');
const errorHandler = require('../../../core/server/controllers/errors.server.controller');

const operation = Symbol();
const OPERATION_TYPE = {
  SAVE: 'save',
  DELETE: 'delete'
};

class BasicController {
  constructor(modelName, options = {}) {
    this.model = mongoose.model(modelName);
    this.modelNameAttr = modelName.toLowerCase();
    this.options = options;
  }

  read(req, res) {
    return res.json(req[this.modelNameAttr]);
  }

  create(req, res) {
    const item = new this.model(req.body);
    item.user = req.user;
    const updatedItem = this.preCreateHandler(req, item);
    this[operation](OPERATION_TYPE.SAVE, updatedItem, res);
  }

  update(req, res) {
    const item = req[this.modelNameAttr];
    const updatedItem = this.preUpdateHandler(req, item);
    this[operation](OPERATION_TYPE.SAVE, updatedItem, res);
  }

  delete(req, res) {
    const item = req[this.modelNameAttr];
    const updatedItem = this.preDeleteHandler(req, item);
    this[operation](OPERATION_TYPE.DELETE, updatedItem, res);
  }

  list(req, res) {
    const { limit = 20, page = 1, q = '' } = req.query;
    const { fieldNames = [] } = this.options;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const $or = fieldNames.map(field => ({ [field]: { $regex: new RegExp(escaped, 'i') } }));
    const extraFilters = this.preListHandler(req);
    const items = this.model.find({ $or, ...extraFilters })
      .limit(+limit)
      .skip((page - 1) * limit)
      .sort('-created')
      .populate('user', 'displayName');

    const count = this.model.countDocuments();
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
  }

  get(req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: 'ID is invalid'
      });
    }

    this.model.findById(id)
      .populate('user', 'displayName')
      .exec((err, item) => {
        if (err) {
          return next(err);
        } else if (!item) {
          return res.status(404).send({
            message: 'No item with that identifier has been found'
          });
        }
        req[this.modelNameAttr] = item;
        next();
      });
  }

  preCreateHandler(req, item) {
    return item;
  }

  preUpdateHandler(req, item) {
    return item;
  }

  preDeleteHandler(req, item) {
    return item;
  }

  /**
   * Pre-list handler
   * @param req
   * @returns {{}}
   */
  preListHandler(req) {
    return {};
  }

  [operation](operationType, item, res) {
    return item[operationType]((err) => {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        return res.json(item);
      }
    });
  }
}

module.exports = BasicController;
