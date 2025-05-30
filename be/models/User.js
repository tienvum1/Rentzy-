const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: false },
  phone: String,
  role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
  is_verified: { type: Boolean, default: false },
  cccd_number: String,

  avatar_url: String,

  driver_license_front_url: String,
  driver_license_back_url: String,
  created_at: { type: Date, default: Date.now },

  googleId: { type: String, unique: true, sparse: true },
  loginMethods: { type: [String], default: ['password'] }

});

module.exports = mongoose.model('User', userSchema);