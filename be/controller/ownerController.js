const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");

exports.becomeOwner = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }


    const { name, phone, cccd_number } = req.body;
    const cccdFrontImage = req.files?.cccd_front_image?.[0];
    const cccdBackImage = req.files?.cccd_back_image?.[0];
    console.log("body" ,req.body)
    console.log("files" ,req.files)
    if (!name || !phone || !cccd_number || !cccdFrontImage || !cccdBackImage) {
      return res
        .status(400)
        .json({
          message: "Vui lòng cung cấp đầy đủ thông tin và hình ảnh CCCD.",
        });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add check for existing owner request status
    if (user.owner_request_owner_status === 'pending') {
        return res.status(409).json({ message: 'Bạn đã gửi yêu cầu đăng ký chủ xe và đang chờ duyệt.' });
    }
    if (user.owner_request_owner_status === 'approved') {
        return res.status(409).json({ message: 'Bạn đã là chủ xe.' });
    }

    // Log Cloudinary config right before upload
    console.log("Cloudinary config RIGHT before upload:", cloudinary.config());

    // Upload ảnh mặt trước CCCD lên Cloudinary
    const frontUpload = await cloudinary.uploader.upload(
      `data:${cccdFrontImage.mimetype};base64,${cccdFrontImage.buffer.toString(
        "base64"
      )}`,
      { folder: "rentzy/cccd" }
    );

    // Upload ảnh mặt sau CCCD lên Cloudinary
    const backUpload = await cloudinary.uploader.upload(
      `data:${cccdBackImage.mimetype};base64,${cccdBackImage.buffer.toString(
        "base64"
      )}`,
      { folder: "rentzy/cccd" }
    );

    // Cập nhật thông tin user
    user.name = name;
    user.phone = phone;
    user.cccd_number = cccd_number;
    user.cccd_front_url = frontUpload.secure_url;
    user.cccd_back_url = backUpload.secure_url;
    user.owner_request_status = "pending";
    user.owner_request_submitted_at = new Date();
     
    console.log("Attempting to save user:", user); // Log user object before save

    try {
      const savedUser = await user.save(); // Capture the result of the save
      console.log("User saved successfully:", savedUser); // Log the saved user object
    } catch (saveError) {
      console.error("Error during user save:", saveError); // Log any specific error from save
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
        cccd_front_image: user.cccd_front_image,
        cccd_back_image: user.cccd_back_image,
      },
    });
  } catch (error) {
    console.error("Error in becomeOwner:", error);
    return res
      .status(500)
      .json({ message: "Server error submitting owner request" });
  }
};

// --- Admin Endpoints (Example) ---

// Get all pending owner requests
exports.getPendingOwnerRequests = async (req, res) => {
  try {
    // Assuming admin check middleware is applied to this route
    // Only fetch users with pending owner requests and select relevant fields
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

// Review (Approve/Reject) an owner request
exports.reviewOwnerRequest = async (req, res) => {
  try {
    // Assuming admin check middleware is applied to this route
    const { userId } = req.params;
    const { status, rejectionReason } = req.body; // status should be 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status provided." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Prevent reviewing already reviewed requests (optional, depends on flow)
    if (user.owner_request_status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Yêu cầu này đã được xử lý." });
    }

    user.owner_request_status = status;
    user.owner_request_reviewed_by = req.user._id; // Assuming admin user is in req.user
    user.owner_request_reviewed_at = new Date();
    user.owner_request_rejection_reason =
      status === "rejected" ? rejectionReason : null;

    if (status === "approved") {
      // Set identity verified for owner
      user.is_identity_verified_for_owner = true;
      // Add 'owner' role if not already present
      if (!user.role.includes("owner")) {
        user.role.push("owner");
      }
    } else if (status === "rejected") {
      // Optionally reset verified status if rejected
      user.is_identity_verified_for_owner = false;
      // Optionally remove 'owner' role if it was somehow added before final approval (less likely with this flow)
      // user.role = user.role.filter(role => role !== 'owner');
    }

    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: `Yêu cầu đã được ${
          status === "approved" ? "chấp nhận" : "từ chối"
        }.`,
      });
  } catch (error) {
    console.error("Error in reviewOwnerRequest:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
