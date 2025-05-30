const mongoose = require('mongoose');

const vehicleImageSchema = new mongoose.Schema({
  image_id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    required: true

  },
  vehicle_id: {
    type: String,
    ref: 'Vehicle',

    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  is_primary: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false

});

const VehicleImage = mongoose.model('VehicleImage', vehicleImageSchema);

module.exports = VehicleImage; 