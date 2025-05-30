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
module.exports = router;
