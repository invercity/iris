const BasicController = require('./basic.server.controller');

class GoodsController extends BasicController {
  constructor() {
    super('Good', {
      fieldNames: [
        'name',
        'details'
      ],
      extraListFilters: [
        {
          key: 'type',
          getFilter: query => ({ type: query.type })
        },
        {
          key: 'oldOnly',
          getFilter: (query) => {
            if (query.oldOnly) {
              return {
                count: {
                  $lte: 20
                }
              };
            }
            return null;
          }
        }
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
