// be/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { protect, verifyRenterRequirements } = require('../middleware/authMiddleware');
const { getVehicleBookedDates,getBookingByIdForOwner, createBooking, getBookingDetails, cancelExpiredBooking, cancelBookingByFrontend, getUserBookings, getAllBookingOfSpecificUser, getFilteredBookingsOfUser, getAllModelOfVehicle, getAllStatusOfBooking, cancelBookingWithRefund, getExpectedRefund, cancelBookingByUser, requestCancelBooking, ownerApproveCancel, ownerRejectCancel, confirmHandover, confirmReturn, uploadPreDeliveryImages, uploadPostDeliveryImages } = require('../controller/bookingController');
const upload = require('../middleware/upload');

// Public routes
router.get('/vehicle/:vehicleId/dates', getVehicleBookedDates);

// Lấy chi tiết đơn thuê cho chủ xe
router.get('/getBookingById/:id', protect, getBookingByIdForOwner);

// Routes cho người dùng thông thường
router.get('/my-bookings', protect, getUserBookings);
router.post('/createBooking', protect, verifyRenterRequirements, createBooking);
router.get('/:id', protect, getBookingDetails);
router.get('/:id/expected-refund', protect, getExpectedRefund); // API lấy thông tin hoàn tiền dự kiến
router.post('/:id/cancel-expired', protect, cancelBookingByFrontend);
// huỷ đơn thue
router.post('/:id/cancel-with-refund', protect, cancelBookingWithRefund);
router.post('/:id/cancel', protect, cancelBookingByUser);
router.post('/:id/request-cancel', protect, requestCancelBooking);
router.post('/:id/owner-approve-cancel', protect, ownerApproveCancel);
router.post('/:id/owner-reject-cancel', protect, ownerRejectCancel);

// Xác nhận giao xe
router.post('/:id/confirm-handover', protect, confirmHandover);
// Xác nhận trả xe
router.post('/:id/confirm-return', protect, confirmReturn);

// Upload ảnh trước khi nhận/giao xe
router.post('/:id/upload-pre-delivery-images', upload.array('images', 5), protect, uploadPreDeliveryImages);
// Upload ảnh sau khi nhận lại xe
router.post('/:id/upload-post-delivery-images', upload.array('images', 5), protect, uploadPostDeliveryImages);

// VAN KHAI : 
// route for get all bookings of specific user : 
router.post('/a/get-filter-bookings', protect, getFilteredBookingsOfUser )
// router for get all models 
router.get("/a/get-all-models", protect, getAllModelOfVehicle)
// router for get all status bookings of specific user 
router.get('/a/get-all-status-of-booking-for-user', protect, getAllStatusOfBooking);
router.get('/get-all-bookings', protect, getAllBookingOfSpecificUser)



module.exports = router;
