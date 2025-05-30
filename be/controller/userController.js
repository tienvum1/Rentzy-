const User = require("../models/User");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const bcrypt = require("bcryptjs");
const path = require('path');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
dotenv.config();

exports.getProfile = async (req, res) => {
  // User ID is available in req.user.user_id from the 'protect' middleware
  const userId = req.user._id;

  if (!userId) {
    console.error("getProfile handler: user_id not found in req.user");
    // This case should ideally not happen if 'protect' middleware works correctly
    return res
      .status(401)
      .json({ message: "Authentication failed, user ID missing" });
  }

  try {
    // Find the user by ID, but select only necessary fields
    const user = await User.findById(userId).select(
      "name email role avatar_url is_verified phone cccd_number driver_license driver_license_front_url driver_license_back_url created_at"
    ); // Select specific fields

    if (!user) {
      console.error(`getProfile handler: User not found with ID: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user profile data
    res.json({
      user: {
        user_id: user._id, // Use _id from Mongoose object
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        phone: user.phone,
        cccd_number: user.cccd_number,
        driver_license: user.driver_license,
        driver_license_front_url: user.driver_license_front_url,
        driver_license_back_url: user.driver_license_back_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi lấy thông tin người dùng." });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Email không tồn tại' }); // Không tiết lộ email tồn tại

    // Tạo token reset password (JWT, expires in 15m)
    const resetToken = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Link reset password
    const resetLink = `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: 'Đặt lại mật khẩu Rentzy',
      html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu. Link này sẽ hết hạn sau 15 phút.</p>`,
    });

    res.json({ message: 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Lỗi server khi gửi email.' });
  }
};


exports.resetPassword = async (req, res) => {

  const {token, password } = req.body;
  console.log(token, password);
  if (!token || !password) return res.status(400).json({ message: 'Thiếu token hoặc mật khẩu mới' });

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user_id);
    if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc user không tồn tại' });

    // Đổi mật khẩu
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

exports.updateAvatar = async (req, res) => {
  const userId = req.user._id;
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file ảnh' });
  }
  try {
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'rentcar/avatar', public_id: `avatar_${userId}_${Date.now()}` },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(buffer);
      });
    };
    const result = await streamUpload(req.file.buffer);
    const user = await User.findByIdAndUpdate(userId, { avatar_url: result.secure_url }, { new: true });
    res.json({ message: 'Cập nhật avatar thành công', avatar_url: user.avatar_url });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật avatar.' });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user._id;
  console.log('updateProfile req.body:', req.body);
  try {
    const { name, phone, cccd_number } = req.body;
    let updateData = { name, phone, cccd_number };
    const streamUpload = (buffer, publicId) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'rentcar/driver_license', public_id: publicId },
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
        const resultFront = await streamUpload(req.files.driver_license_front[0].buffer, `front_${userId}_${Date.now()}`);
        updateData.driver_license_front_url = resultFront.secure_url;
      }
      if (req.files.driver_license_back && req.files.driver_license_back[0]) {
        const resultBack = await streamUpload(req.files.driver_license_back[0].buffer, `back_${userId}_${Date.now()}`);
        updateData.driver_license_back_url = resultBack.secure_url;
      }
    }
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json({ message: 'Cập nhật profile thành công!', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật profile.' });
  }
};