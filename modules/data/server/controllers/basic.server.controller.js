const mongoose = require('mongoose');
const { mergeDeep } = require('../../../../config/lib/util');
const errorHandler = require('../../../core/server/controllers/errors.server.controller');

const operation = Symbol();
const OPERATION_TYPE = {
  SAVE: 'save',
  DELETE: 'delete'
};

/**
 * Return normalized mongoose query object
 * @param {object} query
 * @return {object}
 */
const normalizeQuery = (query) => {
  let { $or, $and, ...rest } = query;
  Object.keys({ $or, $and }).forEach(key => {
    if (query[key] && query[key].length) {
      rest = Object.assign(rest, { [key]: query[key] });
    }
  });
  return rest;
};

/**
 * @typedef ControllerOptions
 * @field {string[]} fieldNames
 * @field {string[]} [populateFields]
 * @field {string[]} [fieldNamesSearch]
 * @field {string[]} [listExtraQueryFields]
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
    console.log('after pre create', updatedItem);
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
    const extraQuery = await this.preListHandler(req);
    const query = mergeDeep({ $or }, extraQuery);
    let items = this.model.find(normalizeQuery(query))
      .limit(+limit)
      .skip((page - 1) * limit)
      .sort('-created')
      .populate('user', 'displayName');
    if (this.options.populateFields) {
      items = items.populate(...this.options.populateFields);
    }
    const count = this.model.countDocuments();
    return Promise.all([items, count])
      .then(([items, count]) => res.json({ items, count }))
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

    let item = this.model.findById(id)
      .populate('user', 'displayName');
    if (this.options.populateFields) {
      item = item.populate(...this.options.populateFields);
    }
    item.exec((err, item) => {
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

  /**
   * Pre-update item hook
   * @param req
   * @param item
   * @returns {Promise<*>}
   */
  async preUpdateHandler(req, item) {
    this.options.fieldNames.forEach(field => item[field] = req.body[field]);
    return Promise.resolve(item);
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
   * Pre-list handler
   * @param req
   * @returns {Promise<*>}
   */
  async preListHandler(req) {
    return {};
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
