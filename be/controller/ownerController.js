const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

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

// --- 2. Lấy danh sách yêu cầu làm chủ xe (dành cho Admin) ---
const getPendingOwnerRequests = async (req, res) => {
  try {
    const pendingRequests = await User.find({
      owner_request_status: "pending",
    }).select(
      "name email phone cccd_number cccd_front_url cccd_back_url owner_request_submitted_at"
    );

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error("Error in getPendingOwnerRequests:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// --- 3. Admin duyệt hoặc từ chối yêu cầu ---
const reviewOwnerRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status provided." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.owner_request_status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Yêu cầu này đã được xử lý." });
    }

    user.owner_request_status = status;
    user.owner_request_reviewed_by = req.user._id;
    user.owner_request_reviewed_at = new Date();
    user.owner_request_rejection_reason =
      status === "rejected" ? rejectionReason : null;

    if (status === "approved") {
      user.is_identity_verified_for_owner = true;
      if (!user.role.includes("owner")) {
        user.role.push("owner");
      }
    } else {
      user.is_identity_verified_for_owner = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Yêu cầu đã được ${status === "approved" ? "chấp nhận" : "từ chối"}.`,
    });
  } catch (error) {
    console.error("Error in reviewOwnerRequest:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// --- 4. Lấy tất cả đơn thuê của chủ xe ---
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

// --- 5. Lấy danh sách yêu cầu huỷ cần duyệt ---
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

// --- Export tất cả ---
module.exports = {
  becomeOwner,
  getPendingOwnerRequests,
  reviewOwnerRequest,
  getOwnerBookings,
  getOwnerCancelRequests,
};
