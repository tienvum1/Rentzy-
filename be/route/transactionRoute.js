const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const transactionController = require('../controller/transactionController');

// Get user's transaction history
router.get('/my-transactions', protect, transactionController.getUserTransactions);

module.exports = router; 