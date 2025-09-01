const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const transactionController = require('../controller/transactionController');

// Get transaction history with exact structure
router.get('/history', protect, transactionController.getTransactionHistory);


module.exports = router; 