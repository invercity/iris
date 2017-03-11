const order = require('../controllers/order.server.controller');

module.exports = (app) => {

  app.route('/api/orders')
    .get(order.list)
    .post(order.create);

  app.route('/api/orders/:orderId')
    .get(order.read)
    .put(order.update)
    .delete(order.delete);

  app.param('orderId', order.orderByID);
};
