const mongoose = require('mongoose');
const { Schema } = mongoose;

const model = 'History';

const schema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    default: '',
    trim: true
  },
  docType: {
    type: String,
    default: '',
    trim: true,
  },
  docId: {
    type: Schema.ObjectId,
  },
  details: {
    type: String,
    default: '',
    trim: true,
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model(model, schema);
