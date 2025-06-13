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

    // Tiền đặt cọc
    deposit: {
      type: Number,
      required: true,
      min: 0,
    },

    // Trạng thái đơn thuê
    status: {
      type: String,
      enum: [
        "pending",         // Mới đặt, chưa thanh toán
        "paid",            // Khách đã thanh toán, chờ chủ xe xác nhận
        "accepted",        // Chủ xe xác nhận giữ xe cho khách
        "rejected",        // Chủ xe từ chối booking (sau khi khách đã thanh toán, cần hoàn tiền)
        "auto_cancelled",  // Hệ thống tự động hủy do quá hạn xác nhận/thanh toán
        "in_progress",     // Đang trong quá trình thuê xe
        "completed",       // Đã trả xe, kết thúc chuyến thuê
        "cancelled",       // Khách tự hủy booking
        "paid_refunded"    // Đã thanh toán nhưng hoàn tiền (do bị từ chối/hủy)
      ],
      default: "pending",
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

    // Danh sách các giao dịch thanh toán
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema); 