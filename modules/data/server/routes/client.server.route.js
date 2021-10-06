const client = require('../controllers/client.server.controller');

module.exports = (app) => {
  app.route('/api/clients')
    .get(client.list.bind(client))
    .post(client.create.bind(client));

  app.route('/api/clients/:clientId')
    .get(client.read.bind(client))
    .put(client.update.bind(client))
    .delete(client.delete.bind(client));

  app.param('clientId', client.get.bind(client));
};
