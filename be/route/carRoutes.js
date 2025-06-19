const express = require("express");
const router = express.Router();
const carController = require('../controller/carController');


router.get('/approved', carController.getApprovedVehicles);
router.get('/:id', carController.getCarById);

module.exports = router; 