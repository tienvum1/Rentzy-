const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { protect } = require("../middleware/authMiddleware");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file vào RAM, không lưu ổ cứng

router.get("/profile", protect, userController.getProfile);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/update-avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.put('/update-profile', protect, upload.fields([
  { name: 'driver_license_front', maxCount: 1 },
  { name: 'driver_license_back', maxCount: 1 }
]), userController.updateProfile);

// New route for creating driver license info
router.post('/create-driver-license', protect, upload.single('driver_license_front'), userController.createDriverLicense);

// New routes for email update and verification
router.put('/update-email', protect, userController.updateEmail);
router.post('/verify-email-otp', protect, userController.verifyEmailOtp);
router.post('/resend-email-otp', protect, userController.resendEmailOtp);

// New route for phone update (will require a new controller function)
router.put('/update-phone', protect, userController.updatePhone); // Link to a future updatePhone controller function

// New route for changing password
router.put('/change-password', protect, userController.changePassword); // Link to a future changePassword controller function

// Admin route to update driver license verification status
router.put('/driver-license-status/:id', protect, userController.updateDriverLicenseVerificationStatus);

module.exports = router;
