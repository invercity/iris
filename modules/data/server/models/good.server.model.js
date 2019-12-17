const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const { Schema } = mongoose;
autoIncrement.initialize(mongoose);

const modelGood = 'Good';

const GoodSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Name cannot be blank'
  },
  details: {
    type: String,
    default: '',
    trim: true,
  },
  code: {
    type: Number,
    default: 1,
  },
  count: {
    type: Number,
    default: 1,
  },
  price: {
    type: Number,
    default: 1,
  },
  weight: {
    type: Number,
    default: 1,
  },
  country: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    default: '',
    trim: true,
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

GoodSchema.plugin(autoIncrement.plugin, {
  model: modelGood,
  field: 'code',
  startAt: 1,
  incrementBy: 1
});

GoodSchema.pre('remove', () => {
  const id = this._id;
  const price = this.price;
  return mongoose.model('Order')
    .find({
      'items.good': {
        $in: [Schema.ObjectId(id)]
      }
    })
    .then((orders) => {
      return Promise.all(orders.map((order) => {
        const good = order.items.find(item => item.good === id);
        if (good) {
          order.total -= price * good.count;
          const index = order.items.indexOf(good);
          order.items.splice(index, 1);
          return order.save();
        }
        return null;
      }));
    });
});

mongoose.model(modelGood, GoodSchema);
