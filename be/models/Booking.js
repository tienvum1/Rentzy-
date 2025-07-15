const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Người thuê xe
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Xe được thuê
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    // Ngày bắt đầu thuê
    startDate: {
      type: Date,
      required: true,
    },

    // Ngày kết thúc thuê
    endDate: {
      type: Date,
      required: true,
    },

    // Giờ nhận xe
    pickupTime: {
      type: String,
      required: true,
    },

    // Giờ trả xe
    returnTime: {
      type: String,
      required: true,
    },

    // Tổng số ngày thuê
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // Tổng tiền thuê (VND)
    // tổng tất cả tiền 
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // tiền thuê xe , vd : 500k/day => 5 days = 2tr5
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    // Tiền giảm giá
    discountAmount: {
      type: Number,
      min: 0,
    },
    // tiền giao xe
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0
    },


    // Trạng thái đơn thuê
    status: {
      type: String,
      enum: [
        'pending',        // Đơn mới tạo, chưa thanh toán cọc
        'deposit_paid',   // Đã thanh toán cọc, xác nhận tự động
        'in_progress',    // Đang thuê xe
        'fully_paid',     // Đã thanh toán toàn bộ
        'completed',      // Đã trả xe, hoàn tất
        'canceled',       // Đã hủy
        'refunded',       // Đã hoàn tiền
        'rejected',       // Bị từ chối (hiếm dùng)
        'cancel_requested' // Đang chờ chủ xe duyệt huỷ
      ],
      default: 'pending'
    },

    // Trạng thái giải ngân cho chủ xe.
    payoutStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    // Trạng thái hoàn tiền cọc cho người thuê
    depositRefundStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    // Số tiền thực nhận (đã trừ phí dịch vụ, bồi thường...).
    payoutAmount: {
      type: Number,
      default: 0
    },
    payoutNote: {
      type: String,
      default: ''
    },

    // Địa chỉ nhận xe
    pickupLocation: {
      type: String,
      required: true,
    },

    // Địa chỉ trả xe
    returnLocation: {
      type: String,
      required: true,
    },

    // Ghi chú từ người thuê
    note: {
      type: String,
      default: "",
    },

    // Đánh giá sau khi thuê (1-5 sao)
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Nhận xét sau khi thuê
    review: {
      type: String,
    },

    // Hình ảnh xe trước khi thuê
    preRentalImages: [{ type: String }], // Ảnh xe trước khi nhận/giao

    // Hình ảnh xe sau khi thuê
    postRentalImages: [{
      type: String,
    }],

    // Lý do hủy (nếu có)
    cancellationReason: {
      type: String,
    },

    // Thời gian hủy
    cancelledAt: {
      type: Date,
    },

    // Người hủy (renter hoặc system)
    cancelledBy: {
      type: String,
      enum: ["renter", "system", "owner"],
    },

    // Mã khuyến mãi
    promoCode: {
      type: String,
    },

    // Giao dịch
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }],

    // --- Thông tin hoàn tiền khi huỷ (FE gửi lên, lưu lại để owner xem và backend dùng khi duyệt) ---
    totalRefund: {
      type: Number,
      default: 0,
    },
    ownerHandoverConfirmed: {
      type: Boolean,
      default: false
    },
    renterHandoverConfirmed: {
      type: Boolean,
      default: false
    },
    ownerReturnConfirmed: {
      type: Boolean,
      default: false
    },
    renterReturnConfirmed: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema); 