const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/authMiddleware');
const walletController = require('../controller/walletController');



// Lấy thông tin ví của user hiện tại (không lấy lịch sử giao dịch)
router.get('/info', protect, walletController.getWallet);

// Tạo yêu cầu nạp tiền qua MoMo
router.post('/deposit', protect, walletController.createDeposit);

// Tạo yêu cầu rút tiền (chờ admin duyệt)
router.post('/withdraw', protect, walletController.createWithdraw);

// Callback từ MoMo sau khi thanh toán (không cần auth)
router.get('/deposit-callback', walletController.depositCallback);

// Webhook từ MoMo (IPN) - không cần auth
router.post('/deposit-webhook', walletController.depositWebhook);

// Admin routes
// Lấy danh sách yêu cầu rút tiền chờ duyệt
router.get('/pending-withdrawals', protect, adminOnly, walletController.getPendingWithdrawals);

// Admin duyệt/từ chối yêu cầu rút tiền
router.put('/withdraw/:transactionId', protect, adminOnly, walletController.approveWithdraw);

module.exports = router;
