const mongoose = require('mongoose'),
  { Schema } = mongoose,
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
  date: {
    type: Date
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

OrderSchema.plugin(autoIncrement.plugin, {
  model: modelOrder,
  field: 'code',
  startAt: 1,
  incrementBy: 1
});

mongoose.model(modelOrder, OrderSchema);
