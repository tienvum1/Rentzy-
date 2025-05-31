const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: false },
  phone: String,
  role: { type: [String], enum: ['renter', 'owner', 'admin'], default: ['renter'] },

  // Verification status fields
  is_verified: { type: Boolean, default: false }, // Email verification status
  
  is_identity_verified_for_owner: { type: Boolean, default: false }, // Identity verification status for owner role (via CCCD)
  is_license_verified_for_renter: { type: Boolean, default: false }, // Driver license verification status for renter role

  cccd_number: String,

  cccd_front_url: String,
  cccd_back_url: String,

  avatar_url: String,

  driver_license_front_url: String,
  driver_license_back_url: String,
  created_at: { type: Date, default: Date.now },

  googleId: { type: String, unique: true, sparse: true },
  loginMethods: { type: [String], default: ['password'] },

  // Fields for Owner Registration and Admin Review
  owner_request_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  owner_request_submitted_at: { type: Date },
  owner_request_reviewed_at: { type: Date },
  owner_request_rejection_reason: { type: String },

});

// To check if a user is an owner, check if 'owner' is present in the role array:
// user.role.includes('owner')

// To check if a user is a renter and can rent, check if 'renter' role is present AND is_license_verified_for_renter is true:
// user.role.includes('renter') && user.is_license_verified_for_renter

// To check if a user is an owner and can list cars, check if 'owner' role is present AND is_identity_verified_for_owner is true:
// user.role.includes('owner') && user.is_identity_verified_for_owner

module.exports = mongoose.model('User', userSchema);