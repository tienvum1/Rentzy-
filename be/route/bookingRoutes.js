// be/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { protect, verifyRenterRequirements } = require('../middleware/authMiddleware');
const { getVehicleBookedDates, createBooking, getBookingDetails, cancelExpiredBooking, cancelBookingByFrontend, getUserBookings, getAllBookingOfSpecificUser } = require('../controller/bookingController');

// Public routes
router.get('/vehicle/:vehicleId/dates', getVehicleBookedDates);

// Routes cho người dùng thông thường
router.get('/my-bookings', protect, getUserBookings);
router.post('/createBooking', protect, verifyRenterRequirements, createBooking);
router.get('/:id', protect, getBookingDetails);
router.post('/:id/cancel-expired', protect, cancelBookingByFrontend);

// VAN KHAI : 
// route for get all bookings of specific user : 
router.get('/a/get-all-bookings', protect, getAllBookingOfSpecificUser)

module.exports = router;