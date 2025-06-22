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
    // thêm mô tả xe 
    description: {
      type: String,
      required: true,
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
    // thêm mô tả xe
    description :{
      type: String,
      required: true,
    },
      

    // Địa chỉ 
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


    // số lượt thuê xe thành công
    // status = "completed" tăng trường rentalCount của xe lên 1.
    rentalCount: {
      type: Number,
      default: 0,
    // User hiện tại đang thuê hoặc giữ chỗ xe này
    currentRenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Thông tin thay đổi đang chờ duyệt
    pendingChanges: {
      type: {
        brand: String,
        model: String,
        location: String,
        pricePerDay: Number,
        deposit: Number,
        fuelConsumption: Number,
        features: [String],
        rentalPolicy: String,
        primaryImage: String,
        gallery: [String],
        // Thông tin chi tiết dựa trên loại xe
        specificDetails: {
          type: {
            // Cho xe hơi
            seatCount: Number,
            bodyType: String,
            transmission: String,
            fuelType: String,
            // Cho xe máy
            engineCapacity: Number,
            hasGear: Boolean
          },
          _id: false
        }
      },
      _id: false,
      default: null
    },

    // Trạng thái thay đổi đang chờ duyệt
    pendingChangeStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },

    // Lý do từ chối thay đổi (nếu có)
    changeRejectionReason: {
      type: String,
      default: null
    }
  }},
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
