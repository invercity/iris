const mongoose = require('mongoose');
const { Schema } = mongoose;

const modelPlace = 'Place';

const PlaceSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  dates: [
    {
      type: Date
    }
  ],
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model(modelPlace, PlaceSchema);
