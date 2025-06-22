const express = require("express");
const router = express.Router();
const carController = require('../controller/carController');


router.post('/approved', carController.getApprovedVehicles);
router.get('/:id', carController.getCarById);

// VAN KHAI : 
router.get('/a/brands', carController.getAllBrands);
router.get('/a/models', carController.getAllModels);
router.get('/a/locations', carController.getAllLocations);
router.get('/a/seatCounts', carController.getAllSeatCounts);
router.get('/a/fuelTypes', carController.getAllFuelTypes);
router.get('/a/transmissions', carController.getAllTransmission);

module.exports = router; 