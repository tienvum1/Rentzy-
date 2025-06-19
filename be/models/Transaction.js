const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['DEPOSIT', 'RENTAL', 'REFUND'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['PAYOS', 'CASH', 'BANK_TRANSFER', 'MOMO', 'WALLET'],
        required: true
    },
    paymentMetadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema); 