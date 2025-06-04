const mongoose = require('mongoose');

const motorbikeSchema = new mongoose.Schema({

  vehicle_id: {
    type: String,
    ref: 'Vehicle',
    required: true
  },
  engine_capacity: {
    type: Number,
    required: true
  },
  has_gear: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: false

});

const Motorbike = mongoose.model('Motorbike', motorbikeSchema);

module.exports = Motorbike; 