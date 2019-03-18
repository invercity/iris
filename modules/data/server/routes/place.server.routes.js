const place = require('../controllers/place.server.controller');

module.exports = (app) => {
  app.route('/api/places')
    .get(place.list)
    .post(place.create);

  app.route('/api/places/:placeId')
    .get(place.read)
    .put(place.update)
    .delete(place.delete);

  app.param('placeId', place.placeByID);
};
