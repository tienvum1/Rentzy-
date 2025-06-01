const mongoose = require("mongoose");

/**
 * Schema Vehicle: quản lý thông tin chung cho xe đăng lên hệ thống
 */

const vehicleSchema = new mongoose.Schema(
  {
    // Người đăng xe (chủ xe)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Thương hiệu xe
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    // Dòng xe
    model: {
      type: String,
      required: true,
      trim: true,
    },

    // Loại xe: car hoặc motorbike
    type: {
      type: String,
      enum: ["car", "motorbike"],
      required: true,
    },

    // Biển số xe (không được trùng)
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Địa chỉ và toạ độ (dùng cho bản đồ)
    location: {
      type: String,
      required: true,
    },

    // Giá thuê mỗi ngày (VND)
    pricePerDay: {
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

    // Mức tiêu hao nhiên liệu (l/100km hoặc tương đương)
    fuelConsumption: {
      type: Number,
      // required: false by default
    },

    // Mô tả tính năng (VD: Bluetooth, camera lùi, điều hoà...)
    features: {
      type: [String],
      default: [],
    },
    // điều khoản thuê xe
    rentalPolicy: {
      type: String,
      default: "",
    },
    // Ảnh chính (Cloudinary URL)
    primaryImage: {
      type: String,
      default: "",
    },

    // Danh sách ảnh phụ (Cloudinary URL)
    gallery: {
      type: [String],
      default: [],
    },

    /**
     * Trạng thái admin duyệt xe:
     * - pending: mới đăng, chờ admin duyệt
     * - approved: đã duyệt, hiển thị cho khách
     * - rejected: bị từ chối
     */
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    /**
     * Trạng thái xe trong hệ thống
     * - available: có sẵn để thuê
     * - reserved: có khách giữ chỗ
     * - rented: đang được thuê
     * - maintenance: bảo trì, không cho thuê
     * - blocked: admin khóa
     */
    status: {
      type: String,
      enum: ["available", "reserved", "rented", "maintenance", "blocked"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
