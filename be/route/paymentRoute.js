const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPayment,
    checkPayment,
    handleWebhook,
    verifyMoMoPayment,
    createWalletDepositPayment,
    createWalletRentalPayment
} = require('../controller/paymentController');

// MoMo Payment Routes
router.post('/momo/create', protect, createPayment);
router.get('/momo/check-payment', checkPayment);
router.post('/momo/webhook', handleWebhook);
router.post('/momo/verify', protect, verifyMoMoPayment);

// Wallet Payment Routes
router.post('/wallet/deposit', protect, createWalletDepositPayment);
router.post('/wallet/rental', protect, createWalletRentalPayment);

module.exports = router; 