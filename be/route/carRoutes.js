const express = require("express");
const router = express.Router();
const carController = require('../controller/carController');


router.get('/approved', carController.getApprovedVehicles);

module.exports = router; 