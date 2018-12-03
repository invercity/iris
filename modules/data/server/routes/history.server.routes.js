const history = require('../controllers/history.server.controller');

module.exports = (app) => {
  app.route('/api/history')
    .get(history.list);
};
