const BasicController = require('./basic.server.controller');

class ClientController extends BasicController {
  constructor() {
    super('Client', {
      fieldNames: [
        'firstName',
        'lastName',
        'phone',
        'defaultPlace',
        'active'
      ],
      fieldNamesSearch: [
        'phone',
        'firstName',
        'lastName'
      ],
      populateFields: [
        'defaultPlace'
      ],
      listExtraQuery: {
        active: true
      }
    });
  }

  async preUpdateHandler(req, item) {
    const updated = await super.preUpdateHandler(req, item);
    updated.active = true;
    if (!updated.defaultPlace) {
      updated.defaultPlace = null;
    }
    return updated;
  }
}

module.exports = new ClientController();
