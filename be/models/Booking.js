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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost:{
      type: Number,
        required: true,
        min: 0,
      },
      // Tiền đặt cọc
      deposit: {
        type: Number,
        required: true,
        min: 0,
      },
        // Tiền giữ chỗ
        reservationFee: {
          type: Number,
          required: true,
          min: 0,
        },

        // Tiền giảm giá
        discountAmount: {
          type: Number,
          min: 0,
        },

    // Trạng thái đơn thuê
    status: {
      type: String,
      enum: ['pending', 'DEPOSIT_PAID', 'accepted', 'in_progress', 'completed', 'canceled', 'rejected'],
      default: 'pending',
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
    preRentalImages: [{
      type: String,
    }],

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema); 