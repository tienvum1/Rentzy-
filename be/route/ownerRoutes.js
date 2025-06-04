const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const ownerController = require('../controller/ownerController');

// Simple middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    // Assuming user info (including roles) is attached to req.user by protect middleware
    if (req.user && req.user.role && req.user.role.includes('admin')) {
        next(); // User is admin, proceed
    } else {
        res.status(403).json({ message: 'Admin access required.' }); // Not authorized
    }
};

router.put(
  '/registerOwner',
  protect,
  upload.fields([
    { name: 'cccd_front_image', maxCount: 1 },
    { name: 'cccd_back_image', maxCount: 1 },
  ]),
  ownerController.becomeOwner
);

// Admin Routes for Owner Request Management
// GET all pending owner requests
router.get(
    '/admin/pendingRequests',
    protect, // Ensure user is authenticated
    checkAdmin, // Ensure user is admin
    ownerController.getPendingOwnerRequests
);

// PUT review an owner request (approve/reject)
router.put(
    '/admin/reviewRequest/:userId',
    protect, // Ensure user is authenticated
    checkAdmin, // Ensure user is admin
    ownerController.reviewOwnerRequest
);

module.exports = router;
