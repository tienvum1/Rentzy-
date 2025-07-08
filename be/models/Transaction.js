const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: [
            'DEPOSIT',         // Thanh toán tiền cọc
            'RENTAL',          // Thanh toán phần còn lại khi nhận xe
            'REFUND',          // Hoàn tiền (cọc, thuê xe...)
            'WALLET_DEPOSIT',  // Nạp tiền vào ví
            'WALLET_WITHDRAW', // Rút tiền từ ví
            'PROMOTION',       // Nhận khuyến mãi
            'FEE',             // Phí dịch vụ
            'PAYOUT'           // Giải ngân cho chủ xe
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['PAYOS', 'CASH', 'BANK_TRANSFER', 'MOMO', 'WALLET', 'VNPAY', 'ZALOPAY'],
        required: true
    },
    paymentMetadata: {
        type: Map,
        of: String
    },
    description: {
        type: String,
        default: ''
    },
    isRefunded: {
        type: Boolean,
        default: false
    },
    refundedTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema); 