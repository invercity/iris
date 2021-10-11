const place = require('../controllers/place.server.controller');

module.exports = (app) => {
  app.route('/api/places')
    .get(place.list.bind(place))
    .post(place.create.bind(place));

  app.route('/api/places/:placeId')
    .get(place.read.bind(place))
    .put(place.update.bind(place))
    .delete(place.delete.bind(place));

  app.param('placeId', place.get.bind(place));
};
