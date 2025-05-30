const mongoose = require('mongoose');

const motorbikeSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  vehicle_id: {
    type: String,
    ref: 'Vehicle',
    required: true,
  },
  engine_capacity: {
    type: Number,
    required: false,
  },
  has_gear: {
    type: Boolean,
    required: false,
  },
}, {
  collection: 'motorbikes',
  timestamps: false,
  _id: false
});

const Motorbike = mongoose.model('Motorbike', motorbikeSchema);

module.exports = Motorbike; 