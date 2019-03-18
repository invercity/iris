const goodsPolicy = require('../policies/goods.server.policy');
const goods = require('../controllers/goods.server.controller');

module.exports = (app) => {
  app.route('/api/goods').all(goodsPolicy.isAllowed)
    .get(goods.list.bind(goods))
    .post(goods.create.bind(goods));

  app.route('/api/goods/:goodId').all(goodsPolicy.isAllowed)
    .get(goods.read.bind(goods))
    .put(goods.update.bind(goods))
    .delete(goods.delete.bind(goods));

  app.param('goodId', goods.get.bind(goods));
};
