const User = require("../models/User");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const path = require("path");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const twilio = require('twilio');
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
    const user = await User.findById(userId); // Select specific fields, including owner_request_owner_status

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
        owner_request_status : user.owner_request_status
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
  const userId = req.user._id;
  if (!req.file) {
    return res.status(400).json({ message: "Không có file ảnh" });
  }
  try {
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "rentcar/avatar",
            public_id: `avatar_${userId}_${Date.now()}`,
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(buffer);
      });
    };
    const result = await streamUpload(req.file.buffer);
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar_url: result.secure_url },
      { new: true }
    );
    res.json({
      message: "Cập nhật avatar thành công",
      avatar_url: user.avatar_url,
    });
  } catch (err) {
    console.error("Update avatar error:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật avatar." });
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
  const userId = req.user._id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email mới là bắt buộc.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    // Check if the new email is the same as the current one
    if (user.email === email) {
        // If email is the same and already verified, just return success
        if(user.is_verified) {
             return res.status(200).json({ message: 'Email đã được xác thực và không thay đổi.' });
        }
         // If email is the same but not verified, potentially resend OTP for current email?
         // For now, let's assume if they explicitly update to the same email, they want to verify that one.
         // We proceed to generate/send OTP for the current email.
    }

    // If email is different, update it and mark as not verified
    if (user.email !== email) {
        user.email = email;
        user.is_verified = false; // Mark as not verified with the new email
    }
    
    // Generate OTP and set expiration (e.g., 10 minutes)
    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // TODO: Send verification email with OTP
    await sendVerificationEmail(user.email, otp);

    res.status(200).json({ message: 'Vui lòng kiểm tra email để xác minh địa chỉ mới.', requiresVerification: true });

  } catch (error) {
    console.error('Error updating email and sending OTP:', error);
    // Handle duplicate email error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(409).json({ message: 'Địa chỉ email này đã được sử dụng bởi người dùng khác.' });
    }
    // Handle other errors
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật email.' });
  }
};

// @desc    Verify email using OTP
// @route   POST /api/user/verify-email-otp
// @access  Private
exports.verifyEmailOtp = async (req, res) => {
    const userId = req.user._id;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'Mã OTP là bắt buộc.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Check if token matches and is not expired
        if (user.emailVerificationToken !== otp || user.emailVerificationExpires < Date.now()) {
            // Optionally clear token after failed attempt if desired, but for now just return error
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
        }

        // OTP is valid, verify email and clear token fields
        user.is_verified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Email đã được xác minh thành công!' });

    } catch (error) {
        console.error('Error verifying email OTP:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xác minh email.' });
    }
};

// @desc    Resend email verification OTP
// @route   POST /api/user/resend-email-otp
// @access  Private
exports.resendEmailOtp = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Check if user is already verified
        if (user.is_verified) {
            return res.status(400).json({ message: 'Email của bạn đã được xác minh.' });
        }

        // Generate new OTP and set expiration
        const otp = generateOTP();
        user.emailVerificationToken = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // TODO: Send verification email with the new OTP
        await sendVerificationEmail(user.email, otp);

        res.status(200).json({ message: 'Mã OTP mới đã được gửi tới email của bạn.' });

    } catch (error) {
        console.error('Error resending email OTP:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi lại mã OTP.' });
    }
};

// Function to send phone verification SMS (Requires SMS gateway integration)
const sendVerificationSMS = async (phone, otp) => {
  console.log(`Attempting to send verification SMS to ${phone} with OTP: ${otp}`);

  // --- Start SMS Gateway Integration (Example with Twilio) ---
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // Get from environment variables
    const authToken = process.env.TWILIO_AUTH_TOKEN;     // Get from environment variables
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Get from environment variables

    console.log('DEBUG: Twilio Account SID:', accountSid);
    console.log('DEBUG: Twilio Auth Token (first 5 chars):', authToken ? authToken.substring(0, 5) + '...' : 'null'); // Log partial token for security
    console.log('DEBUG: Twilio Phone Number:', twilioPhoneNumber);

    // Check for required environment variables
    if (!accountSid || !authToken || !twilioPhoneNumber) {
        console.error("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER) are not set in environment variables.");
        throw new Error("SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.");
    }

    const client = twilio(accountSid, authToken);

    // --- Định dạng số điện thoại nhận về E.164 ---
    let formattedPhone = phone;
    // Giả định số điện thoại từ frontend là định dạng Việt Nam (0...)
    if (phone.startsWith('0')) {
        formattedPhone = '+84' + phone.substring(1);
    }
    // TODO: Cần xử lý các định dạng số quốc tế khác nếu cần
    // --- Kết thúc Định dạng ---


    // Send the message
    const message = await client.messages.create({
      body: `Mã xác minh Rentzy của bạn là: ${otp}. Mã này sẽ hết hạn sau 10 phút.`, // SMS content
      from: twilioPhoneNumber, // Your Twilio phone number
      to: formattedPhone              // User's phone number (đã định dạng)
    });

    console.log('SMS sent successfully. Message SID:', message.sid); // Log successful send

  } catch (error) {
    console.error('Error sending verification SMS:', error);
    // Throw the error so the calling function knows it failed
    throw new Error('Failed to send verification SMS.');
  }
  // --- End SMS Gateway Integration ---
};

// @desc    Update user phone and send verification OTP
// @route   PUT /api/user/update-phone
// @access  Private
exports.updatePhone = async (req, res) => {
    const userId = req.user._id;
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Số điện thoại mới là bắt buộc.' });
    }

    try {
        const user = await User.findById(userId);
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
        user.phoneVerificationToken = otp;
        user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // TODO: Send verification SMS with OTP (integrate SMS gateway)
        await sendVerificationSMS(user.phone, otp); // Call placeholder function

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
    const userId = req.user._id;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'Mã OTP là bắt buộc.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Check if token matches and is not expired
        if (user.phoneVerificationToken !== otp || user.phoneVerificationExpires < Date.now()) {
            // Optionally clear token after failed attempt if desired, but for now just return error
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
        }

        // OTP is valid, verify phone and clear token fields
        user.is_phone_verified = true;
        user.phoneVerificationToken = undefined;
        user.phoneVerificationExpires = undefined;

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
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Check if user is already phone verified
        if (user.is_phone_verified) {
            return res.status(400).json({ message: 'Số điện thoại của bạn đã được xác minh.' });
        }

        // Generate new OTP and set expiration
        const otp = generateOTP();
        user.phoneVerificationToken = otp;
        user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // TODO: Send verification SMS with the new OTP (integrate SMS gateway)
        await sendVerificationSMS(user.phone, otp); // Call placeholder function

        res.status(200).json({ message: 'Mã OTP mới đã được gửi tới số điện thoại của bạn.' });

    } catch (error) {
        console.error('Error resending phone OTP:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi lại mã OTP.' });
    }
};

// @desc    Change user password
// @route   PUT /api/user/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const userId = req.user._id; // User ID from protect middleware
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu.' });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' });
    }

    if (newPassword.length < 6) {
         return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Check if user has a password hash (users who logged in only via OAuth might not)
        if (!user.password_hash) {
             return res.status(400).json({ message: 'Bạn không thể đổi mật khẩu vì tài khoản của bạn được đăng ký qua Google.' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu cũ không chính xác.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password_hash = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu đã được đổi thành công.' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đổi mật khẩu.' });
    }
};
