const BasicController = require('./basic.server.controller');

class GoodsController extends BasicController {
  constructor() {
    super('Good', {
      fieldNames: [
        'name',
        'count',
        'price',
        'details',
        'type'
      ],
      fieldNamesSearch: [
        'name',
        'details'
      ]
    });
  }
}

module.exports = new GoodsController();
