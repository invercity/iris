const BasicController = require('./basic.server.controller');

class PlaceServerController extends BasicController {
  constructor() {
    super('Place', {
      fieldNames: [
        'name',
        'address',
        'dates'
      ],
      fieldNamesSearch: [
        'name',
        'address'
      ]
    });
  }
}

module.exports = new PlaceServerController();
