const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const wallletController = require('../controller/walletController');



// Lấy thông tin ví của user hiện tại (không lấy lịch sử giao dịch)
router.get('/info', protect, wallletController.getWallet);

module.exports = router;
