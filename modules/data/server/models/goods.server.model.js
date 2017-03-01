'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose);

/**
 * Good Schema
 */
var GoodSchema = new Schema({
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
    trim: true
  },
  count: {
    type: Number,
    default: 1,
    trim: true
  },
  price: {
    type: Number,
    default: 1,
    trim: true
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
  model: 'Good',
  field: 'code',
  startAt: 1,
  incrementBy: 1
});

mongoose.model('Good', GoodSchema);
