const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/vehicleController');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');
const { getApprovedVehicles } = require('../controller/vehicleController');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory for processing
const upload = multer({ storage: storage }); // Keep storage config

// Route to add a new vehicle
router.post(
  '/add',
  protect,
  upload.fields([ // Use .fields to handle multiple file fields
    { name: 'main_image', maxCount: 1 }, // Expecting one main image file
    { name: 'additional_images', maxCount: 10 } // Expecting up to 10 additional image files
  ]),
  vehicleController.addVehicle
);

// Route to get all vehicles
router.get('/owner', protect, vehicleController.getOwnerVehicles);

// Route to get all vehicles
router.get('/', vehicleController.getVehicles);

// Add route to get approved vehicles with filters
router.get('/approved', getApprovedVehicles);

// Add route to get a single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Add route to delete a vehicle
router.delete('/:id', vehicleController.deleteVehicle);

// Add route to update a vehicle
router.put(
  '/:id',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 10 }
  ]),
  vehicleController.updateVehicle
);

module.exports = router; 