const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/vehicleController');
// You will likely need middleware for authentication and file uploads
const { protect ,adminOnly} = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');

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
router.get('/', protect, vehicleController.getOwnerVehicles);

// Route to get all vehicles by admin
router.get('/admin/pending-approvals',protect,adminOnly, vehicleController.getPendingVehicleApprovalsForAdmin);
// Add other vehicle related routes here (get, update, delete, etc.)

// Route to get all vehicles
router.get('/', vehicleController.getVehicles);

// Add route to get a single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Add route to delete a vehicle
router.delete('/:id', vehicleController.deleteVehicle);

// Add route to update a vehicle
router.put('/:id', upload.none(), vehicleController.updateVehicle);

module.exports = router; 