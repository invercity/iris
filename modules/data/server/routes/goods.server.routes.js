const goodsPolicy = require('../policies/goods.server.policy'),
  goods = require('../controllers/goods.server.controller');

module.exports = (app) => {

  app.route('/api/goods').all(goodsPolicy.isAllowed)
    .get(goods.list)
    .post(goods.create);

  app.route('/api/goods/:goodId').all(goodsPolicy.isAllowed)
    .get(goods.read)
    .put(goods.update)
    .delete(goods.delete);

  app.param('goodId', goods.goodByID);
};
