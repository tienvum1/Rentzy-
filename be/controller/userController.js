const User = require("../models/User");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const bcrypt = require("bcryptjs");
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
      "name email role avatar_url is_verified"
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