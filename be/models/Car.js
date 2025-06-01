const mongoose = require('mongoose');

/**
 * Schema Car: dùng cho các xe là type = 'car'
 * Lưu thông tin chi tiết về ô tô
 */

const carSchema = new mongoose.Schema({

  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true
  },

  // Số chỗ ngồi
  seatCount: {
    type: Number,
    required: true,
    min: 2
  },

  // Dạng thân xe (sedan, SUV, hatchback, pickup...)
  bodyType: {
    type: String,
    required: true
  },

  // Hộp số
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },

  // Nhiên liệu
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
