const User = require("../models/User");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const path = require("path");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const twilio = require('twilio');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const { URL } = require('url');
const otpGenerator = require('otp-generator');
dotenv.config();

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "Email không tồn tại" }); // Không tiết lộ email tồn tại

    // Tạo token reset password (JWT, expires in 15m)
    const resetToken = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Link reset password
    const resetLink = `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Đặt lại mật khẩu Rentzy",
      html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu. Link này sẽ hết hạn sau 15 phút.</p>`,
    });

    res.json({ message: "Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Lỗi server khi gửi email." });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  console.log(token, password);
  if (!token || !password)
    return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới" });

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user_id);
    if (!user)
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc user không tồn tại" });

    // Đổi mật khẩu
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({
      message:
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      width: 150,
      height: 150,
      crop: 'fill'
    });

    const user = await User.findById(req.user._id);
    user.avatar_url = result.secure_url;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar_url: user.avatar_url
    });

  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Error updating avatar" });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user._id;
  console.log("updateProfile req.body:", req.body);
  try {
    const { name, phone, cccd_number } = req.body;
    let updateData = { name, phone, cccd_number };
    const streamUpload = (buffer, publicId) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "rentcar/driver_license", public_id: publicId },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(buffer);
      });
    };
    if (req.files) {
      if (req.files.driver_license_front && req.files.driver_license_front[0]) {
        const resultFront = await streamUpload(
          req.files.driver_license_front[0].buffer,
          `front_${userId}_${Date.now()}`
        );
        updateData.driver_license_front_url = resultFront.secure_url;
      }
      if (req.files.driver_license_back && req.files.driver_license_back[0]) {
        const resultBack = await streamUpload(
          req.files.driver_license_back[0].buffer,
          `back_${userId}_${Date.now()}`
        );
        updateData.driver_license_back_url = resultBack.secure_url;
      }
    }
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    res.json({ message: "Cập nhật profile thành công!", user, requiresVerification: false });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật profile." });
  }
};

// Function to generate a random OTP
const generateOTP = () => {
  // Generate a 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

// Function to send email verification OTP
const sendVerificationEmail = async (email, otp) => {
  console.log(`Sending verification email to ${email} with OTP: ${otp}`);
  
  try {
    // Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from environment variables
        pass: process.env.EMAIL_PASS, // Your Gmail password or app password from environment variables
      },
    });

    // Send the email
    await transporter.sendMail({
      to: email, // Recipient's email address
      subject: "Mã xác minh email Rentzy của bạn", // Email subject
      html: `<p>Mã xác minh email của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn sau 10 phút.</p>`, // Email body with OTP
    });

    console.log('Verification email sent successfully.');

  } catch (error) {
    console.error('Error sending verification email:', error);
    // Depending on requirements, you might want to throw the error or handle it silently
    throw new Error('Failed to send verification email.'); // Propagate the error
  }
};

// @desc    Update user email and send verification OTP
// @route   PUT /api/user/update-email
// @access  Private
exports.updateEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.new_email = email;
    user.email_otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    user.email_otp_expires = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save({ validateBeforeSave: false });

    // Gửi email OTP ở đây (logic gửi email)

    res.status(200).send('OTP sent to new email address for verification.');

  } catch (error) {
    res.status(500).send('Server error');
  }
};

// @desc    Verify email using OTP
// @route   POST /api/user/verify-email-otp
// @access  Private
exports.verifyEmailOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.new_email || user.email_otp !== otp || user.email_otp_expires < Date.now()) {
      return res.status(400).send('Invalid or expired OTP.');
    }

    user.email = user.new_email;
    user.new_email = undefined;
    user.email_otp = undefined;
    user.email_otp_expires = undefined;
    await user.save({ validateBeforeSave: false });

    res.send('Email updated successfully.');
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// @desc    Resend email verification OTP
// @route   POST /api/user/resend-email-otp
// @access  Private
exports.resendEmailOtp = async (req, res) => {
  // Logic tương tự updateEmail nhưng không đổi new_email
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.new_email) {
      return res.status(400).send('No pending email update found.');
    }
    user.email_otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    user.email_otp_expires = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save({ validateBeforeSave: false });
    // Gửi lại email
    res.send('OTP resent.');
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// --- UPDATED IMPLEMENTATION FOR "SmsGateway" (blue icon) ---
const sendVerificationSMS = async (phone, otp) => {
  // The BASE URL of your self-hosted SMS gateway server (e.g., http://192.168.1.15:38261)
  // This needs to be configured in your .env file.
  const smsGatewayBaseUrl = process.env.SMS_GATEWAY_URL;

  if (!smsGatewayBaseUrl) {
    console.error('SMS Gateway URL is not configured. Please set SMS_GATEWAY_URL in your .env file.');
    throw new Error('Dịch vụ SMS không được cấu hình. OTP (dev anly): ' + otp);
  }

  try {
    const message = `Ma xac minh Rentzy cua ban la: ${otp}`; // Sending without accents for better compatibility

    // Construct the full URL with query parameters based on the app's settings
    const url = new URL(smsGatewayBaseUrl);
    url.searchParams.append('tel', phone);       // Phone number parameter key is 'tel'
    url.searchParams.append('message', message); // Text parameter key is 'message'

    console.log(`Sending GET request to Gateway: ${url.href}`);

    // Using axios to send a GET request
    const response = await axios.get(url.href);

    // Assuming a 200 OK status means the gateway accepted the request.
    // The actual success/error response may vary by app.
    if (response.status === 200) {
      console.log(`Gateway accepted request to send SMS to: ${phone}`);
    } else {
      throw new Error(`Gateway returned an error with status: ${response.status}`);
    }

  } catch (error) {
    console.error('Lỗi khi kết nối tới SMS Gateway:', error.message);
    throw new Error('Không thể kết nối tới dịch vụ SMS.');
  }
};

// @desc    Update user phone and send verification OTP
// @route   PUT /api/user/update-phone
// @access  Private
exports.updatePhone = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Số điện thoại mới là bắt buộc.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    // Check if the new phone is the same as the current one
    if (user.phone === phone) {
      // If phone is the same and already verified, just return success
      if(user.is_phone_verified) {
        return res.status(200).json({ message: 'Số điện thoại đã được xác thực và không thay đổi.' });
      }
      // If phone is the same but not verified, potentially resend OTP for current phone?
      // For now, let's assume if they explicitly update to the same phone, they want to verify that one.
      // We proceed to generate/send OTP for the current phone.
    }

    // If phone is different, update it and mark as not verified
    if (user.phone !== phone) {
      user.phone = phone;
      user.is_phone_verified = false; // Mark as not verified with the new phone
    }

    // Generate OTP and set expiration (e.g., 10 minutes)
    const otp = generateOTP();
    user.phone_otp = otp;
    user.phone_otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Send verification SMS with OTP
    await sendVerificationSMS(user.phone, otp);

    res.status(200).json({ message: 'Vui lòng kiểm tra điện thoại để xác minh số mới.', requiresVerification: true });

  } catch (error) {
    console.error('Error updating phone and sending OTP:', error);
    // Handle duplicate phone error specifically (assuming your DB enforces unique phones)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
      return res.status(409).json({ message: 'Số điện thoại này đã được sử dụng bởi người dùng khác.' });
    }
    // Handle other errors
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật số điện thoại.' });
  }
};

// @desc    Verify phone using OTP
// @route   POST /api/user/verify-phone-otp
// @access  Private
exports.verifyPhoneOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'Mã OTP là bắt buộc.' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    // Check if token matches and is not expired
    if (user.phone_otp !== otp || user.phone_otp_expires < new Date()) {
      // Optionally clear token after failed attempt if desired, but for now just return error
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    // OTP is valid, verify phone and clear token fields
    user.is_phone_verified = true;
    user.phone_otp = undefined;
    user.phone_otp_expires = undefined;

    await user.save();

    res.status(200).json({ message: 'Số điện thoại đã được xác minh thành công!' });

  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xác minh số điện thoại.' });
  }
};

// @desc    Resend phone verification OTP
// @route   POST /api/user/resend-phone-otp
// @access  Private
exports.resendPhoneOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Số điện thoại mới là bắt buộc.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.phone) {
      return res.status(404).json({ message: "Không tìm thấy người dùng hoặc số điện thoại." });
    }

    if (user.is_phone_verified) {
      return res.status(400).json({ message: "Số điện thoại đã được xác thực." });
    }

    // Generate a new OTP and expiry
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP
    user.phone_otp = otp;
    user.phone_otp_expires = otpExpires;
    await user.save();

    // Resend SMS
    await sendVerificationSMS(user.phone, otp);

    res.status(200).json({ message: "Đã gửi lại mã OTP thành công." });
  } catch (error) {
    console.error("Lỗi khi gửi lại OTP điện thoại:", error);
    res.status(500).json({ message: error.message || "Lỗi server khi gửi lại OTP." });
  }
};

// @desc    Change user password
// @route   PUT /api/user/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.json({ message: "Mật khẩu đã được thay đổi thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create or update driver license info
// @route   POST /api/user/create-driver-license
// @access  Private
exports.createDriverLicense = async (req, res) => {
  try {
    const { driver_license_full_name, driver_license_birth_date, driver_license_number } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let imageUrl = user.driver_license_image; // Giữ lại ảnh cũ làm mặc định

    // Nếu có file mới được tải lên, upload nó và cập nhật URL
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'driver_licenses'
      });
      imageUrl = result.secure_url;
    }

    // Cập nhật thông tin cho người dùng
    user.driver_license_full_name = driver_license_full_name;
    user.driver_license_birth_date = driver_license_birth_date;
    user.driver_license_number = driver_license_number;
    user.driver_license_image = imageUrl; // Luôn cập nhật URL ảnh
    user.driver_license_verification_status = 'pending'; // Đặt trạng thái chờ duyệt

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Thông tin GPLX đã được gửi để chờ duyệt!', user });

  } catch (error) {
    console.error("Error creating/updating driver license:", error);
    res.status(500).json({ message: 'Lỗi khi xử lý thông tin GPLX.' });
  }
};

// @desc    Update driver license verification status by admin
// @route   PUT /api/user/driver-license-status/:id
// @access  Private/Admin
exports.updateDriverLicenseVerificationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.driver_license_verification_status = status;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `Driver license status updated to ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating license status' });
  }
};

// Lấy thông tin ví và lịch sử giao dịch của user
exports.getWalletAndTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    // Lấy ví của user
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Không tìm thấy ví.' });
    }
    // Lấy các transaction liên quan đến user (theo booking của user hoặc theo ví nếu có)
    // Ở đây lấy tất cả transaction liên quan đến user (có thể mở rộng filter theo ví nếu cần)
    const transactions = await Transaction.find({})
      .populate({
        path: 'booking',
        select: 'vehicle startDate endDate totalAmount status',
        populate: {
          path: 'vehicle',
          select: 'brand model primaryImage'
        }
      })
      .sort({ createdAt: -1 });
    // Lọc transaction liên quan đến user
    const userTransactions = transactions.filter(tran => {
      return tran.booking && tran.booking.renter && tran.booking.renter.toString() === userId.toString();
    });
    res.json({ wallet, transactions: userTransactions });
  } catch (error) {
    console.error('Error fetching wallet and transactions:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin ví.' });
  }
};
