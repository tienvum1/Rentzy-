const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  console.log(req.body);
  try {
    // Check email tồn tại
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    // Mã hóa password
    const hash = await bcrypt.hash(password, 10);

    // Tạo user (chưa xác thực)
    const user = await User.create({
      name, email, password_hash: hash, phone, is_verified: false, role: 'renter'
    });

    // Tạo token xác thực email
    const emailToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Gửi email xác thực
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your Rentzy account',
      html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
    });

    res.status(201).json({ message: 'Register success! Please check your email to verify.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.update({ is_verified: true }, { where: { user_id: decoded.user_id } });
      res.json({ message: 'Email verified successfully!' });
    } catch (err) {
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  };

  exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      if (!user.is_verified) return res.status(400).json({ message: 'Please verify your email' });
  
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Tạo JWT
      const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.logout = (req, res) => {
    // FE chỉ cần xóa token, BE không cần xử lý gì thêm
    res.json({ message: 'Logged out' });
  };