const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

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

mongoose.model(modelOrder, OrderSchema);
