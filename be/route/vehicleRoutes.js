const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/vehicleController');
// You will likely need middleware for authentication and file uploads
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory for processing
const upload = multer({ storage: storage });

// Route to add a new vehicle (requires authentication and file upload handling)
router.post(
  '/add',
  protect, // Protect the route, assuming it adds user info to req.user
  upload.array('images', 10), // 'images' is the field name for files, 10 is max count
  vehicleController.addVehicle
);

// Add other vehicle related routes here (get, update, delete, etc.)

module.exports = router; 