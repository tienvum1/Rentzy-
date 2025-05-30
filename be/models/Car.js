const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({

  vehicle_id: {
    type: String,
    ref: 'Vehicle',
    required: true
  },
  seats: {
    type: Number,
    required: true
  },
  body_type: {
    type: String,
    required: true
  },
  transmission: {
    type: String,
    required: true
  },
  fuel_type: {
    type: String,
    required: true
  }
}, {
  timestamps: false

});

const Car = mongoose.model('Car', carSchema);

module.exports = Car; 