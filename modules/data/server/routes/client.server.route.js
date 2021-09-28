const client = require('../controllers/client.server.controller');

module.exports = (app) => {
  app.route('/api/clients')
    .get(client.list)
    .post(client.create);

  app.route('/api/clients/:clientId')
    .get(client.read)
    .put(client.update)
    .delete(client.delete);

  app.param('clientId', client.get.bind(this));
};
