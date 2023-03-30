const mongoose = require('mongoose');
const { AutoIncrementSimple } = require('@typegoose/auto-increment');

const { Schema } = mongoose;

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

GoodSchema.plugin(AutoIncrementSimple, [{
  field: 'code',
  startAt: 1,
  incrementBy: 1
}]);

mongoose.model(modelGood, GoodSchema);
