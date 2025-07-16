const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Notification = require('../models/Notification');

// --- 1. Gửi yêu cầu trở thành chủ xe ---
const becomeOwner = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Chỉ cho phép nếu CCCD đã xác thực
    if (user.cccd_verification_status !== 'verified') {
      return res.status(400).json({ message: 'Bạn cần xác thực CCCD thành công trước khi đăng ký làm chủ xe.' });
    }

    if (user.owner_request_status === "pending") {
      return res.status(409).json({ message: "Bạn đã gửi yêu cầu và đang chờ duyệt." });
    }
    if (user.owner_request_status === "approved") {
      return res.status(409).json({ message: "Bạn đã là chủ xe." });
    }

    user.owner_request_status = "pending";
    user.owner_request_submitted_at = new Date();
    await user.save();

    // Gửi thông báo cho user
    await Notification.create({
      user: user._id,
      type: 'system',
      title: 'Yêu cầu đăng ký chủ xe',
      message: 'Yêu cầu đăng ký chủ xe của bạn đã được gửi và đang chờ admin duyệt.',
      data: { owner_request_status: 'pending' },
    });

    // Gửi thông báo cho admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'admin',
        title: 'Yêu cầu đăng ký chủ xe mới',
        message: `Người dùng ${user.name} (${user.email}) vừa gửi yêu cầu trở thành chủ xe.`,
        data: { userId: user._id, name: user.name, email: user.email },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Yêu cầu đăng ký chủ xe đã được gửi.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        owner_request_status: user.owner_request_status,
      },
    });
  } catch (error) {
    console.error("Error in becomeOwner:", error);
    return res.status(500).json({ message: "Server error submitting owner request" });
  }
};

// --- 2. Lấy tất cả đơn thuê của chủ xe ---
const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const vehicles = await Vehicle.find({ owner: ownerId }).select("_id");
    const vehicleIds = vehicles.map((v) => v._id);

    const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
      .populate("vehicle", "brand model")
      .populate("renter", "name email");

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Error in getOwnerBookings:", err);
    res
      .status(500)
      .json({ success: false, message: "Không thể lấy danh sách đơn thuê." });
  }
};

// --- 3. Lấy danh sách yêu cầu huỷ cần duyệt ---
const getOwnerCancelRequests = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).select("_id");
    const vehicleIds = vehicles.map((v) => v._id);

    const bookings = await Booking.find({
      vehicle: { $in: vehicleIds },
      status: "cancel_requested",
    })
      .populate("vehicle", "brand model")
      .populate("renter", "name fullName email");

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error("getOwnerCancelRequests error:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy danh sách đơn huỷ." });
  }
};

// donah thu 
// --- 4. Lấy doanh thu của chủ xe ---
const getOwnerRevenue = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { type = 'month', start, end } = req.query;

    // Lấy tất cả xe của owner
    const vehicles = await Vehicle.find({ owner: ownerId }).select('_id');
    const vehicleIds = vehicles.map(v => v._id);

    // Chỉ lấy booking đã hoàn thành
    const match = {
      vehicle: { $in: vehicleIds },
      status: 'completed',
    };
    if (start || end) {
      match.createdAt = {};
      if (start) match.createdAt.$gte = new Date(start);
      if (end) match.createdAt.$lte = new Date(end);
    }

    // Group theo type
    let groupId = null;
    if (type === 'day') {
      groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    } else if (type === 'week') {
      groupId = { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } };
    } else if (type === 'month') {
      groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    } else if (type === 'year') {
      groupId = { year: { $year: '$createdAt' } };
    }

    const revenue = await Booking.aggregate([
      { $match: match },
      { $group: {
        _id: groupId,
        totalRevenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Tổng doanh thu toàn bộ
    const total = await Booking.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, revenue, total: total[0] || { totalRevenue: 0, count: 0 } });
  } catch (err) {
    console.error('Error in getOwnerRevenue:', err);
    res.status(500).json({ success: false, message: 'Không thể lấy doanh thu.' });
  }
};

// --- 5. Lấy số lượng xe của owner theo tháng trong năm hiện tại ---
const getOwnerVehicleStatsByMonth = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const year = now.getFullYear();
    const stats = await Vehicle.aggregate([
      { $match: {
          owner: ownerId,
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      { $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);
    res.json({ success: true, year, stats });
  } catch (err) {
    console.error("Error in getOwnerVehicleStatsByMonth:", err);
    res.status(500).json({ success: false, message: "Không thể lấy thống kê xe theo tháng." });
  }
};

// --- 6. Lấy số lượng đơn thuê của owner theo tháng trong năm hiện tại ---
const getOwnerBookingStatsByMonth = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const year = now.getFullYear();
    // Lấy tất cả xe của owner
    const vehicles = await Vehicle.find({ owner: ownerId }).select('_id');
    const vehicleIds = vehicles.map(v => v._id);
    const stats = await Booking.aggregate([
      { $match: {
          vehicle: { $in: vehicleIds },
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      { $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);
    res.json({ success: true, year, stats });
  } catch (err) {
    console.error("Error in getOwnerBookingStatsByMonth:", err);
    res.status(500).json({ success: false, message: "Không thể lấy thống kê đơn thuê theo tháng." });
  }
};

// --- Export tất cả ---
module.exports = {
  becomeOwner,
  getOwnerBookings,
  getOwnerCancelRequests,
  getOwnerRevenue,
  getOwnerVehicleStatsByMonth,
  getOwnerBookingStatsByMonth,
};
