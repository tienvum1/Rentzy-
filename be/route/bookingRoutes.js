// be/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { protect ,verifyRenterRequirements} = require('../middleware/authMiddleware');
const { getVehicleBookedDates,createBooking,getBookingDetails }  = require('../controller/bookingController');

// Public routes
router.get('/vehicle/:vehicleId/dates',getVehicleBookedDates);


// Routes cho người dùng thông thường
router.post('/createBooking',protect,verifyRenterRequirements, createBooking);
router.get('/:id', protect, getBookingDetails);


module.exports = router;