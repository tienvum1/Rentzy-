const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { 
    getOwnerRequests, 
    updateOwnerRequestStatus, 
    getVehicleApprovalRequests, 
    updateVehicleApprovalStatus,
    getDriverLicenseRequests,
    updateDriverLicenseStatus
} = require('../controller/adminController');

// Route để lấy danh sách các yêu cầu trở thành chủ xe
router.get('/owner-requests', protect, adminOnly, getOwnerRequests);

// Route để cập nhật trạng thái yêu cầu của chủ xe
router.put('/owner-requests/:userId', protect, adminOnly, updateOwnerRequestStatus);

// Route để lấy danh sách các xe chờ duyệt
router.get('/vehicle-approvals', protect, adminOnly, getVehicleApprovalRequests);

// Route để cập nhật trạng thái của xe
router.put('/vehicle-approvals/:vehicleId', protect, adminOnly, updateVehicleApprovalStatus);

// Route để lấy danh sách các yêu cầu xác thực GPLX
router.get('/driver-license-requests', protect, adminOnly, getDriverLicenseRequests);

// Route để cập nhật trạng thái xác thực GPLX
router.put('/driver-license-status/:userId', protect, adminOnly, updateDriverLicenseStatus);

module.exports = router;