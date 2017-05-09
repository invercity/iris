const mongoose = require('mongoose'),
  { Schema } = mongoose,
  async = require('async'),
  Good = mongoose.model('Good'),
  autoIncrement = require('mongoose-auto-increment');

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
  }
});

OrderSchema.plugin(autoIncrement.plugin, {
  model: modelOrder,
  field: 'code',
  startAt: 1,
  incrementBy: 1
});

OrderSchema.pre('save', function (next) {
  async.parallel([
    (next) => {
      if (this._id) {
        mongoose.model('Order').findById(this._id)
          .populate('items.good')
          .exec((err, order) => {
            if (order && order.items) {
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
            good.count -= item.count;
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
});

OrderSchema.post('remove', function (order) {
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
});

mongoose.model(modelOrder, OrderSchema);
