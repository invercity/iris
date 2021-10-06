const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const Good = mongoose.model('Good');
const { Schema } = mongoose;
autoIncrement.initialize(mongoose);

const modelOrder = 'Order';

const OrderSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  client: {
    type: Schema.ObjectId,
    ref: 'Client'
  },
  items: [
    {
      good: {
        type: Schema.ObjectId,
        ref: 'Good'
      },
      count: {
        type: Number,
        default: 1
      }
    }
  ],
  code: {
    type: Number,
    default: 1,
  },
  place: {
    type: Schema.ObjectId,
    ref: 'Place'
  },
  placeDescription: {
    type: String,
    default: ''
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  payed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'work' // other types: ready, togo, done
  },
  credit: {
    type: Number,
    default: 0
  },
  sale: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0,
  },
  extra: {
    type: Number,
    default: 0
  }
});

OrderSchema.plugin(autoIncrement.plugin, {
  model: modelOrder,
  field: 'code',
  startAt: 1,
  incrementBy: 1
});

OrderSchema.pre('save', () => {
  return Promise.resolve()
    .then(() => {
      if (!this._id) {
        return null;
      }
      console.log('Update existing order');
      return mongoose.model('Order')
        .findById(this._id)
        .populate('items.good');
    })
    .then((order) => {
      if (!order || !order.items) {
        return null;
      }
      const ids = order.items.map((item) => {
        if (item.good && item.good._id) {
          return item.good._id;
        }
        return null;
      }).filter(item => item);
      const goods = Good.find({ _id: { $in: ids } });
      return Promise.all([goods, order]);
    })
    .then((results) => {
      if (!results) {
        return null;
      }
      const [goods, order] = results;
      const { items } = this;
      return Promise.all(goods.map((good) => {
        const after = items.find(item => item.good && item.good._id === good._id);
        const before = order.items.find(item => item.good && item.good.id === good._id);
        good.count += (before.count - after.count);
        return good.save();
      }));
    });
});

/* OrderSchema.pre('save', function (next) {
  async.parallel([
    (next) => {
      if (this._id) {
        console.log('Update existing order');
        mongoose.model('Order').findById(this._id)
          .populate('items.good')
          .exec((err, order) => {
            if (order && order.items) {
              const functions = order.items.map(item => {
                return (next) => {
                  // TODO: fix with missing good
                  if (!item.good || !item.good._id) {
                    console.log('Good is missing');
                    return next();
                  }
                  Good.findById(item.good._id)
                    .exec((err, good) => {
                      console.log('Found good _id:', good._id);
                      console.log('Good count: ', good.count);
                      good.count += item.count;
                      console.log('Good count after: ', good.count);
                      good.save(() => {
                        next();
                      });
                    });
                };
              });

              async.parallel(functions, () => {
                next();
              });
            }
            else {
              next();
            }
          });
      }
      else {
        next();
      }
    }
  ], () => {
    const functions = this.items.map(item => {
      return (next) => {
        const id = item.good._id || item.good;
        Good.findById(id)
          .exec((err, good) => {
            console.log('Minus good _id:', good._id);
            console.log('Good cound: ', good.count);
            good.count -= item.count;
            console.log('good count after: ', good.count);
            good.save(() => {
              next();
            });
          });
      };
    });

    async.parallel(functions, () => {
      next();
    });
  });
}); */

OrderSchema.post('remove', (order) => {
  return Promise.resolve()
    .then(() => {
      if (order.payed) {
        return null;
      }
      const ids = order.items.map(item => item._id);
      return Good.find({ _id: { $in: ids } });
    })
    .then((goods) => {
      if (!goods) {
        return null;
      }
      return Promise.all(goods.map((good) => {
        const orderGood = order.goods.find(orderGood => orderGood._id === good._id);
        good.count += orderGood.count;
        return good.save();
      }));
    });
});

/* OrderSchema.post('remove', function (order) {
  const functions = order.items.map(item => {
    return (next) => {
      Good.findById(item.good._id)
        .exec((err, good) => {
          good.count += item.count;
          good.save(() => {
            next();
          });
        });
    };
  });

  if (!order.payed) {
    async.parallel(functions, () => {});
  }
}); */

mongoose.model(modelOrder, OrderSchema);
