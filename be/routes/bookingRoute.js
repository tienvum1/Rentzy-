// Get user's bookings
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings); 