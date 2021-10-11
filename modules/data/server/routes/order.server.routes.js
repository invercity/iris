const order = require('../controllers/order.server.controller');

module.exports = (app) => {
  app.route('/api/orders')
    .get(order.list.bind(order))
    .post(order.create.bind(order));

  app.route('/api/orders/:orderId')
    .get(order.read.bind(order))
    .put(order.update.bind(order))
    .delete(order.delete.bind(order));

  app.param('orderId', order.get.bind(order));
};
