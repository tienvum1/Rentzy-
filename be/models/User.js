const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: false },
  phone: String,
  role: { type: [String], enum: ['renter', 'owner', 'admin'], default: ['renter'] },

  // Verification email status fields
  emailVerificationToken: String, // Field to store the email verification token (OTP)
  emailVerificationExpires: Date, // Field to store the expiration time for the token
  is_verified: { type: Boolean, default: false }, // Email verification status

   // Phone verification fields
   phoneVerificationToken: String, // Field to store the phone verification token (OTP)
   phoneVerificationExpires: Date, // Field to store the expiration time for the phone token
   is_phone_verified: { type: Boolean, default: false }, // Phone verification status

  avatar_url: String,

  cccd_number: String,
  cccd_front_url: String,
  cccd_back_url: String,
  is_identity_verified_for_owner: { type: Boolean, default: false }, // Identity verification status for owner role (via CCCD)

 

  driver_license_number: String,
  driver_license_front_url: String,
  driver_license_back_url: String,
  is_license_verified_for_renter: { type: Boolean, default: false }, // Driver license verification status for renter role

  created_at: { type: Date, default: Date.now },

  googleId: { type: String, unique: true, sparse: true },
  loginMethods: { type: [String], default: ['password'] },

  // Fields for Owner Registration and Admin Review
  owner_request_status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  owner_request_submitted_at: { type: Date },
  owner_request_reviewed_at: { type: Date },
  owner_request_rejection_reason: { type: String },

  // xác minh email
  

});

// To check if a user is an owner, check if 'owner' is present in the role array:
// user.role.includes('owner')

// To check if a user is a renter and can rent, check if 'renter' role is present AND is_license_verified_for_renter is true:
// user.role.includes('renter') && user.is_license_verified_for_renter

// To check if a user is an owner and can list cars, check if 'owner' role is present AND is_identity_verified_for_owner is true:
// user.role.includes('owner') && user.is_identity_verified_for_owner

module.exports = mongoose.model('User', userSchema);