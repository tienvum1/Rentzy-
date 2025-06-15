const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // Booking liên quan
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // Người thực hiện giao dịch
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Số tiền giao dịch
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Loại giao dịch
    type: {
      type: String,
      enum: [
        "rental_fee",     // Phí thuê xe
        "additional_fee", // Phí phát sinh
        "cancellation",   // Phí hủy
        "refund"         // Hoàn tiền
      ],
      required: true,
    },

    // Phương thức giao dịch
    method: {
      type: String,
      enum: ["credit_card", "bank_transfer", "cash"],
      required: true,
    },

    // Trạng thái giao dịch
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    // ID giao dịch từ cổng thanh toán
    transactionId: {
      type: String,
    },

    // Thông tin thẻ (nếu giao dịch bằng thẻ)
    cardInfo: {
      last4Digits: String,
      cardType: String,
    },

    // Thông tin chuyển khoản (nếu giao dịch bằng chuyển khoản)
    bankTransferInfo: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      transferId: String,
    },

    // Mô tả giao dịch
    description: {
      type: String,
    },

    // Thời gian hoàn thành giao dịch
    completedAt: {
      type: Date,
    },

    // Thời gian hoàn tiền (nếu có)
    refundedAt: {
      type: Date,
    },

    // Lý do hoàn tiền
    refundReason: {
      type: String,
    },

    // Biên lai giao dịch
    receipt: {
      type: String, // URL của biên lai
    },

    // Metadata từ cổng thanh toán
    paymentMetadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Phương thức kiểm tra xem giao dịch có thể hoàn tiền không
transactionSchema.methods.canBeRefunded = function() {
  return (
    this.status === "completed" &&
    !this.refundedAt &&
    new Date() <= new Date(this.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) // Trong vòng 30 ngày
  );
};

// Phương thức tính phí hoàn tiền
transactionSchema.methods.calculateRefundAmount = function() {
  if (this.type === "deposit") {
    return this.amount; // Hoàn toàn bộ tiền đặt cọc
  } else if (this.type === "rental_fee") {
    const daysSincePayment = Math.floor(
      (new Date() - this.completedAt) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePayment <= 7) {
      return this.amount * 0.8; // Hoàn 80% nếu trong 7 ngày
    }
    return this.amount * 0.5; // Hoàn 50% nếu sau 7 ngày
  }
  return 0;
};

module.exports = mongoose.model("Transaction", transactionSchema); 