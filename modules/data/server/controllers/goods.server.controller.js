const BasicController = require('./basic.server.controller');

class GoodsController extends BasicController {
  constructor() {
    super('Good', {
      fieldNames: [
        'name',
        'details'
      ]
    });
  }

  preUpdateHandler(req, item) {
    item.name = req.body.name;
    item.count = req.body.count;
    item.price = req.body.price;
    item.details = req.body.details;
    item.type = req.body.type;
    return item;
  }
}

module.exports = new GoodsController();
