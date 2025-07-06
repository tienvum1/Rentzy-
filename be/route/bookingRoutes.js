// be/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { protect, verifyRenterRequirements } = require('../middleware/authMiddleware');
const { getVehicleBookedDates, createBooking, getBookingDetails, cancelExpiredBooking, cancelBookingByFrontend, getUserBookings, getAllBookingOfSpecificUser, getFilteredBookingsOfUser, getAllModelOfVehicle, getAllStatusOfBooking,cancelBookingWithRefund, getExpectedRefund  } = require('../controller/bookingController');

// Public routes
router.get('/vehicle/:vehicleId/dates', getVehicleBookedDates);

// Routes cho người dùng thông thường
router.get('/my-bookings', protect, getUserBookings);
router.post('/createBooking', protect, verifyRenterRequirements, createBooking);
router.get('/:id', protect, getBookingDetails);
router.get('/:id/expected-refund', protect, getExpectedRefund); // API lấy thông tin hoàn tiền dự kiến
router.post('/:id/cancel-expired', protect, cancelBookingByFrontend);
// huỷ đơn thue
router.post('/:id/cancel-with-refund', protect, cancelBookingWithRefund);

// VAN KHAI : 
// route for get all bookings of specific user : 
router.post('/a/get-filter-bookings', protect, getFilteredBookingsOfUser )
// router for get all models 
router.get("/a/get-all-models", protect, getAllModelOfVehicle)
// router for get all status bookings of specific user 
router.get('/a/get-all-status-of-booking-for-user', protect, getAllStatusOfBooking);
router.get('/get-all-bookings', protect, getAllBookingOfSpecificUser)



module.exports = router;