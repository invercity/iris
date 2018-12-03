const mongoose = require('mongoose');

const { Schema } = mongoose;
const basicModel = {
  _id:  Schema.Types.ObjectId,
  t: Date, // when history was made
  o: String, // type
  d: Schema.Types.Mixed
};

mongoose.model('GoodHistory', new Schema(basicModel));
mongoose.model('OrderHistory', new Schema(basicModel));
