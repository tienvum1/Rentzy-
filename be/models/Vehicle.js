// be/models/Vehicle.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const vehicleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  owner_id: {
    type: String,
    ref: 'User',
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['car', 'motorbike']
  },
  license_plate: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  is_available: {
    type: Boolean,
    default: true,
    required: true,
  },
  price_per_day: {
    type: Number,
    required: true,
  },
  deposit_required: {
    type: Number,
    required: false,
  },
  terms: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  collection: 'vehicles',
  timestamps: false,
  _id: false
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 