const BasicController = require('./basic.server.controller');

class OrderController extends BasicController {
  constructor() {
    super('Order', {
      fieldNames: [
        'items',
        'place',
        'placeDescription',
        'date',
        'status',
        'sale',
        'credit',
        'total',
        'extra'
      ],
      fieldNamesSearchFilter: [
        'client',
        'place',
        'payed'
      ],
      populateFields: [
        'client',
        'items.good',
        'place'
      ]
    });
  }

  async preCreateHandler(req, item) {
    await this.saveClient(req.body, item);
    await this.updateGoodsCountOnUpdateOrder(null, item);
    return item;
  }

  async preUpdateHandler(req, item) {
    const existingOrder = req[this.modelNameAttr];
    const updatedOrder = await this.saveClient(req.body, item);
    return this.updateGoodsCountOnUpdateOrder(existingOrder, updatedOrder);
  }

  async preDeleteHandler(req, item) {
    return this.updateGoodsCountOnUpdateOrder(item, null, true);
  }

  async preListHandler(req) {
    const {
      query: {
        q = '',
        good,
      }
    } = req;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return Promise.resolve()
      .then(() => {
        if (q && q.length > 2) {
          const fields = [
            'firstName',
            'phone',
          ];
          const $or = fields.map(field => ({ [field]: { $regex: new RegExp(escaped), $options: 'i' } }));
          const Client = this.mongoose.model('Client');
          return Client.find({ $or })
            .select('_id');
        }
        return null;
      })
      .then((clientIds) => {
        const { Types } = this.mongoose;
        const $or = [];
        const $and = [];
        if (q && !isNaN(q)) {
          $or.push({ code: +q });
        }
        if (clientIds) {
          $or.push({ client: { $in: clientIds } });
        }
        if (good) {
          $and.push({ 'items.good': { $in: [new Types.ObjectId(good)] } });
        }
        return { $or, $and };
      });
  }

  /**
   * Save/update client on save order
   * @param {object} body
   * @param {object} item
   * @return {Promise<object>}
   */
  async saveClient(body, item) {
    const { place, client } = body;
    client.defaultPlace = place;
    const Client = this.mongoose.model('Client');
    if (!client._id) {
      const newClient = new Client(client);
      await newClient.save();
      item.client = newClient._id;
    } else {
      const { _id, phone } = client;
      await Client.updateOne({ _id }, { $set: { $set: { phone, defaultPlace: place, active: true } } });
      item.client = _id;
    }
    if (!item.extra) {
      item.extra = 0;
    }
    return item;
  }

  /**
   * Update good count on order save/delete
   * @param {object} existingOrder
   * @param {object} newOrder
   * @param {boolean} deleteOrder
   * @return {Promise<object>}
   */
  async updateGoodsCountOnUpdateOrder(existingOrder, newOrder, deleteOrder = false) {
    const Good = this.mongoose.model('Good');

    if (deleteOrder && existingOrder.payed) {
      return existingOrder;
    }

    await Promise.resolve()
      .then(() => {
        const ids = newOrder.items.map(item => item.good._id);
        if (existingOrder && existingOrder.items) {
          ids.push(...existingOrder.items.map(item => item.good));
        }
        return Good.find({ _id: { $in: ids } });
      })
      .then((goods) => {
        const emptyOrder = { items: [] };
        return Promise.all(goods.map((good) => {
          const after = (newOrder || emptyOrder).items.find(item =>
            item.good && (good._id.equals(item.good) || (good._id.equals(item.good._id))));
          const before = (existingOrder || emptyOrder).items.find(item =>
            item.good && (good._id.equals(item.good) || (good._id.equals(item.good._id))));
          if (before && after) {
            if (before.count === after.count) {
              return null;
            }
            good.count += (before.count - after.count);
          } else if (!before) {
            good.count -= after.count;
          } else {
            good.count += before.count;
          }
          return good.save();
        }));
      });
    return newOrder || existingOrder;
  }
}

module.exports = new OrderController();
