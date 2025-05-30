const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    required: true
  },
  owner_id: {
    type: String,
    ref: 'User',
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['car', 'motorbike'],
    required: true
  },
  license_plate: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  is_available: {
    type: Boolean,
    default: true
  },
  price_per_day: {
    type: Number,
    required: true
  },
  deposit_required: {
    type: Number,
    required: true
  },
  terms: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;