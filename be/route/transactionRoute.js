const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const transactionController = require('../controller/transactionController');

// Get user's transaction history with pagination and filters
router.get('/my-transactions', protect, transactionController.getUserTransactions);

// Get transaction history with exact structure
router.get('/history', protect, transactionController.getTransactionHistory);

// Get wallet transactions with pagination and filters
router.get('/wallet/:walletId', protect, transactionController.getWalletTransactions);

// Get transaction by ID
router.get('/:transactionId', protect, transactionController.getTransactionById);

// Get transaction statistics for user
router.get('/stats/overview', protect, transactionController.getTransactionStats);

module.exports = router; 