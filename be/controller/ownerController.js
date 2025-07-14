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

    const { name, phone, cccd_number } = req.body;
    const cccdFrontImage = req.files?.cccd_front_image?.[0];
    const cccdBackImage = req.files?.cccd_back_image?.[0];

    if (!name || !phone || !cccd_number || !cccdFrontImage || !cccdBackImage) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ thông tin và hình ảnh CCCD.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.owner_request_status === "pending") {
      return res
        .status(409)
        .json({ message: "Bạn đã gửi yêu cầu và đang chờ duyệt." });
    }
    if (user.owner_request_status === "approved") {
      return res.status(409).json({ message: "Bạn đã là chủ xe." });
    }

    const frontUpload = await cloudinary.uploader.upload(
      `data:${cccdFrontImage.mimetype};base64,${cccdFrontImage.buffer.toString("base64")}`,
      { folder: "rentzy/cccd" }
    );

    const backUpload = await cloudinary.uploader.upload(
      `data:${cccdBackImage.mimetype};base64,${cccdBackImage.buffer.toString("base64")}`,
      { folder: "rentzy/cccd" }
    );

    user.name = name;
    user.phone = phone;
    user.cccd_number = cccd_number;
    user.cccd_front_url = frontUpload.secure_url;
    user.cccd_back_url = backUpload.secure_url;
    user.owner_request_status = "pending";
    user.owner_request_submitted_at = new Date();

    const savedUser = await user.save();

    // --- Notification logic ---
    // 1. Notify the user
    await Notification.create({
      user: savedUser._id,
      type: 'system',
      title: 'Yêu cầu đăng ký chủ xe',
      message: 'Yêu cầu đăng ký chủ xe của bạn đã được gửi và đang chờ admin duyệt.',
      data: { owner_request_status: 'pending' },
    });

    // 2. Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'admin',
        title: 'Yêu cầu đăng ký chủ xe mới',
        message: `Người dùng ${savedUser.name} (${savedUser.email}) vừa gửi yêu cầu trở thành chủ xe.`,
        data: { userId: savedUser._id, name: savedUser.name, email: savedUser.email },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Yêu cầu đăng ký chủ xe đã được gửi.",
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        owner_request_status: savedUser.owner_request_status,
        cccd_front_image: savedUser.cccd_front_url,
        cccd_back_image: savedUser.cccd_back_url,
      },
    });
  } catch (error) {
    console.error("Error in becomeOwner:", error);
    return res
      .status(500)
      .json({ message: "Server error submitting owner request" });
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

// --- Export tất cả ---
module.exports = {
  becomeOwner,
  getOwnerBookings,
  getOwnerCancelRequests,
  getOwnerRevenue,
};
