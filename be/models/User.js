const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: false },
  phone: String,
  role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
  is_verified: { type: Boolean, default: false },
  cccd_number: String,
  driver_license: String,
  avatar_url: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);