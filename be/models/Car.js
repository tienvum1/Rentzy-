const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  vehicle_id: {
    type: String,
    ref: 'Vehicle',
    required: true,
  },
  seats: {
    type: Number,
    required: false,
  },
  body_type: {
    type: String,
    required: false,
  },
  transmission: {
    type: String,
    required: false,
  },
  fuel_type: {
    type: String,
    required: false,
  },
}, {
  collection: 'cars',
  timestamps: false,
  _id: false
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car; 