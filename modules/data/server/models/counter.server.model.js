const mongoose = require('mongoose');

const { Schema } = mongoose;

const modelCounter = 'Counter';

const CounterSchema = new Schema({
    model: String,
    field: String,
    count: Number,
});

mongoose.model(modelCounter, CounterSchema, 'identitycounters');