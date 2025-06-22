const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/vehicleController');
// You will likely need middleware for authentication and file uploads
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
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
router.get('/admin/pending-approvals', protect, adminOnly, vehicleController.getPendingVehicleApprovalsForAdmin);

// Route to get all vehicles
router.get('/', vehicleController.getVehicles);

// Add route to get a single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Add route to delete a vehicle
router.delete('/:id', vehicleController.deleteVehicle);

// Add route to update a vehicle
router.put('/:id', upload.none(), vehicleController.updateVehicle);

// Add route for Admin to review vehicle approval
router.put('/admin/vehicles/review/:vehicleId', protect, adminOnly, vehicleController.reviewVehicleApproval);

// New route to get all approved vehicles
router.get('/approved', vehicleController.getApprovedVehicles);

// New routes for vehicle edit functionality
// Route for owner to request vehicle update
router.put(
  '/:id/request-update',
  protect,
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 10 }
  ]),
  vehicleController.requestVehicleUpdate
);

// Route for admin to get vehicles with pending changes
router.get(
  '/admin/pending-changes',
  protect,
  adminOnly,
  vehicleController.getVehiclesWithPendingChanges
);

// Route for admin to review vehicle changes
router.put(
  '/admin/review-changes/:vehicleId',
  protect,
  adminOnly,
  vehicleController.reviewVehicleChanges
);

module.exports = router; 