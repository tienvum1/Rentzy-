const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPayment,
    checkPayment,
    handleWebhook,
    verifyMoMoPayment
} = require('../controller/paymentController');

// MoMo Payment Routes
router.post('/momo/create', protect, createPayment); // Tạo thanh toán mới
router.get('/momo/check', checkPayment); // Kiểm tra trạng thái thanh toán
router.post('/momo/webhook', handleWebhook); // Xử lý webhook từ MoMo
router.post('/momo/verify-payment', protect, verifyMoMoPayment); // Xác minh thanh toán

module.exports = router; 