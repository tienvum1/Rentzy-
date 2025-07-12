const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminController = require('../controller/adminController');

// Route để lấy danh sách các yêu cầu trở thành chủ xe
router.get('/owner-requests', protect, adminOnly, adminController.getOwnerRequests);
// Route để cập nhật trạng thái yêu cầu của chủ xe
router.put('/owner-requests/:userId', protect, adminOnly, adminController.updateOwnerRequestStatus);

// Route để lấy danh sách các xe chờ duyệt
router.get('/vehicle-approvals', protect, adminOnly, adminController.getPendingVehicleApprovals);
// Route để lấy chi tiết xe chờ duyệt
router.get('/vehicle-approvals/:id', protect, adminOnly, adminController.getPendingVehicleDetail);
// Route để duyệt xe
router.put('/vehicle-approvals/:vehicleId', protect, adminOnly, adminController.reviewVehicleApproval);

// Route để lấy danh sách các yêu cầu xác thực GPLX
router.get('/driver-license-requests', protect, adminOnly, adminController.getDriverLicenseRequests);

// Route để cập nhật trạng thái xác thực GPLX
router.put('/driver-license-status/:userId', protect, adminOnly, adminController.updateDriverLicenseStatus);

router.get('/payout-requests', adminController.getPayoutRequests);
router.post('/approve-payout/:bookingId', protect, adminOnly, adminController.approvePayoutBooking);


module.exports = router;