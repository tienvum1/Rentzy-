const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const vehicleImageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  vehicle_id: {
    type: String,
    ref: 'Vehicle',
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  is_primary: {
    type: Boolean,
    default: false,
    required: true,
  },
}, {
  collection: 'vehicle_images',
  timestamps: false,
  _id: false
});

const VehicleImage = mongoose.model('VehicleImage', vehicleImageSchema);

module.exports = VehicleImage; 