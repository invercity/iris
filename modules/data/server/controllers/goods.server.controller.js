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

  preListHandler(req) {
    const filters = super.preListHandler(req);
    if (req.query.excludeEmpty) {
      filters.count = {
        $gt: 0
      };
    }
    return filters;
  }
}

module.exports = new GoodsController();
