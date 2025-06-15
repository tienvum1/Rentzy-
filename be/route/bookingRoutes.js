// be/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/vehicle/:vehicleId/dates', bookingController.getVehicleBookedDates);


// Routes cho người dùng thông thường
router.post('/createBooking',protect, bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingDetails);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/payment-status', bookingController.updatePaymentStatus);

module.exports = router;