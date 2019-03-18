const mongoose = require('mongoose');
const GoodHistory = mongoose.model('GoodHistory');
const OrderHistory = mongoose.model('OrderHistory');

const TYPE_MATRIX = {
  order: OrderHistory,
  good: GoodHistory
};

const DEFAULT_TYPE = 'good';

exports.list = (req, res) => {
  const { type = DEFAULT_TYPE, page = 1, limit = 20 } = req.query;
  const Model = TYPE_MATRIX[type];
  if (!Model) {
    return res.status(401).send();
  }
  const list = Model.find()
    .limit(+limit)
    .skip((page - 1) * limit);
  return Promise.resolve(list);
};
