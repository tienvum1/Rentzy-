const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminController = require('../controller/adminController');

// Simple middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    // Assuming user info (including roles) is attached to req.user by protect middleware
    if (req.user && req.user.role && req.user.role.includes('admin')) {
        next(); // User is admin, proceed
    } else {
        res.status(403).json({ message: 'Admin access required.' }); // Not authorized
    }
};

// Admin Routes for Owner Request Management
// GET all pending owner requests
router.get(
    '/owner/pendingRequests', // Changed route path for clarity
    protect, // Ensure user is authenticated
    checkAdmin, // Ensure user is admin
    adminController.getPendingOwnerRequests
);

// PUT review an owner request (approve/reject)
router.put(
    '/owner/reviewRequest/:userId', // Changed route path for clarity
    protect, // Ensure user is authenticated
    checkAdmin, // Ensure user is admin
    adminController.reviewOwnerRequest
);

module.exports = router;
