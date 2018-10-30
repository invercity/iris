const mongoose = require('mongoose'),
  { Schema } = mongoose;

const modelClient = 'Client';

const ClientSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  firstName: {
    type: String,
    default: '',
    trim: true,
  },
  lastName: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  defaultAddress: {
    type: String,
    default: '',
    trim: true,
  },
  defaultPlace: {
    type: Schema.ObjectId,
    ref: 'Place'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  },
});

mongoose.model(modelClient, ClientSchema);
