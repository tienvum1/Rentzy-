const mongoose = require('mongoose');

const motorbikeSchema = new mongoose.Schema({

  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
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