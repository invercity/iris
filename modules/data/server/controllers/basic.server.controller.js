const mongoose = require('mongoose');
const errorHandler = require('../../../core/server/controllers/errors.server.controller');

const operation = Symbol();
const OPERATION_TYPE = {
  SAVE: 'save',
  DELETE: 'delete'
};

/**
 * @typedef ControllerOptions
 * @field {string[]} fieldNames
 * @field {string[]} [populateFields]
 * @field {string[]} [fieldNamesSearch]
 */

/**
 * @class BasicController
 * @version 1.0.0
 */
class BasicController {
  /**
   * Basic controller constructor
   * @param {string} modelName
   * @param {ControllerOptions} options
   */
  constructor(modelName, options = {}) {
    this.mongoose = mongoose;
    this.model = mongoose.model(modelName);
    this.modelNameAttr = modelName.toLowerCase();
    this.options = options;
  }

  /**
   * Read item
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async read(req, res) {
    return res.json(req[this.modelNameAttr]);
  }

  /**
   * Create item
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async create(req, res) {
    const itemData = {};
    this.options.fieldNames.forEach(field => itemData[field] = req.body[field]);
    const item = new this.model(itemData);
    item.user = req.user;
    const updatedItem = await this.preCreateHandler(req, item);
    return this[operation](OPERATION_TYPE.SAVE, updatedItem, res);
  }

  /**
   * Update item
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async update(req, res) {
    const item = req[this.modelNameAttr];
    const updatedItem = await this.preUpdateHandler(req, item);
    return this[operation](OPERATION_TYPE.SAVE, updatedItem, res);
  }

  /**
   * Delete item
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async delete(req, res) {
    const item = req[this.modelNameAttr];
    const updatedItem = await this.preDeleteHandler(req, item);
    return this[operation](OPERATION_TYPE.DELETE, updatedItem, res);
  }

  /**
   * Get item list by params
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async list(req, res) {
    const { limit = 20, page = 1, q = '' } = req.query;
    const { fieldNamesSearch = [] } = this.options;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const $or = fieldNamesSearch.map(field => ({ [field]: { $regex: new RegExp(escaped, 'i') } }));
    let items = this.model.find({ $or })
      .limit(+limit)
      .skip((page - 1) * limit)
      .sort('-created')
      .populate('user', 'displayName');
    if (this.options.populateFields) {
      items = items.populate(...this.options.populateFields);
    }
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

  /**
   * Get item by id
   * @param req
   * @param res
   * @param next
   * @param id
   * @returns {Promise<*>}
   */
  async get(req, res, next, id) {
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

  /**
   * Pre-create item hook
   * @param req
   * @param item
   * @returns {Promise<*>}
   */
  async preCreateHandler(req, item) {
    return Promise.resolve(item);
  }

  preUpdateHandler(req, item) {
    return item;
  }

  /**
   * Pre-delete item hook
   * @param req
   * @param item
   * @returns {Promise<*>}
   */
  async preDeleteHandler(req, item) {
    return Promise.resolve(item);
  }

  /**
   * Save/delete operation
   * @param {string} operationType
   * @param {object} item
   * @param res
   * @returns {Promise<*>}
   */
  async [operation](operationType, item, res) {
    try {
      const saveResponse = await item[operationType]();
      return res.json(saveResponse);
    } catch (e) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(e)
      });
    }
  }
}

module.exports = BasicController;
