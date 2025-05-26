const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email exists
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      phone,
      is_verified: false,
      role: 'renter',
    });

    // Generate email verification token
    const emailToken = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: 'Verify your Rentzy account',
      html: `<p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    res.status(201).json({ message: 'Register successful! Please check your email to verify.' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded); // Log khi decode thành công
    // console.log('Using JWT_SECRET:', process.env.JWT_SECRET); // Có thể bỏ log này sau khi debug
    // console.log('Received Token:', token); // Có thể bỏ log này sau khi debug

    // *** SỬA LỖI Ở ĐÂY: Dùng Mongoose method để cập nhật ***
    // Tìm user bằng user_id từ token và cập nhật is_verified
    const updatedUser = await User.findByIdAndUpdate(
        decoded.user_id, // Corrected: Use decoded.user_id as the token payload contains user_id
        { is_verified: true },
        { new: true } // Trả về document sau khi cập nhật
    );

    // Kiểm tra xem user có tồn tại và được cập nhật không
    if (!updatedUser) {
        console.error('Error: User not found for verification ID:', decoded.user_id); // Corrected log
        return res.status(400).json({ message: 'Invalid or expired token' }); // Hoặc thông báo khác rõ ràng hơn
    }

    console.log(`User ${decoded.user_id} verified successfully.`); // Corrected log

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    // Log chi tiết lỗi jwt.verify (nếu có) hoặc lỗi khác
    console.error('Error during email verification:', err.message);
    // console.error('Error details:', err); // Log toàn bộ object lỗi để debug sâu hơn

    // Trả về thông báo chung cho client
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.is_verified) return res.status(400).json({ message: 'Please verify your email' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  // Frontend chỉ cần xóa token
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// GOOGLE LOGIN CALLBACK
exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { user_id: req.user.user_id, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(`${process.env.FRONTEND_URL}/login-success`);
};
