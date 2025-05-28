const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require("validator");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  console.log(req.body);
  try {
    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if email exists
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      phone,
      is_verified: false,
      role: "renter",
    });

    // Generate email verification token
    const emailToken = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const verificationUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${emailToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Verify your Rentzy account",
      html: `<p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    res.status(201).json({
      message: "Register successful! Please check your email to verify.",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded); // Log khi decode thành công
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
      console.error(
        "Error: User not found for verification ID:",
        decoded.user_id
      ); // Corrected log
      return res.status(400).json({ message: "Invalid or expired token" }); // Hoặc thông báo khác rõ ràng hơn
    }

    console.log(`User ${decoded.user_id} verified successfully.`); // Corrected log

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    // Log chi tiết lỗi jwt.verify (nếu có) hoặc lỗi khác
    console.error("Error during email verification:", err.message);
    // console.error('Error details:', err); // Log toàn bộ object lỗi để debug sâu hơn

    // Trả về thông báo chung cho client
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email first
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Check if email is verified
    if (!user.is_verified)
      return res.status(400).json({ message: "Please verify your email" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    // Check if password matches
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("login token", token);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Đăng nhập thất bại:", error.response?.data || error.message);

    let errorMessage = "Đã xảy ra lỗi trong quá trình đăng nhập."; // Default error message

    if (error.response) {
      // Check if there's a specific message from the backend
      if (error.response.data && error.response.data.message) {
        const backendMessage = error.response.data.message;

        // Handle specific backend messages
        if (backendMessage === "Invalid credentials") {
          errorMessage = "Sai email hoặc mật khẩu.";
        } else if (backendMessage === "Please verify your email") {
          errorMessage =
            "Tài khoản chưa xác thực. Vui lòng kiểm tra email để xác thực.";
        } else {
          // For other backend messages, display them directly
          errorMessage = `Đăng nhập thất bại: ${backendMessage}`;
        }
      } else {
        // If no specific message in data, use status text or a generic message
        errorMessage = `Đăng nhập thất bại: ${
          error.response.statusText || "Lỗi không xác định từ server."
        }`;
      }
    }

    res.status(500).json({ message: errorMessage });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  // Frontend chỉ cần xóa token
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};


// GOOGLE LOGIN CALLBACK
exports.googleCallback = (req, res) => {
  console.log("Inside googleCallback");
  console.log("req.user:", req.user);

  if (!req.user) {
    console.error("req.user is not defined in googleCallback");
    return res.redirect(
      `${process.env.CLIENT_ORIGIN}/login?error=google_auth_failed`
    );
  }

  try {
    const token = jwt.sign(
      { user_id: req.user._id, role: req.user.role }, // Đã sửa
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("JWT token created");

    // Always set the cookie after successful Google auth
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'Lax'
    });
    console.log("Cookie set after Google auth.");

    let redirectUrl;
    const user = req.user;

    if (!user.password_hash) {
      redirectUrl = `${process.env.CLIENT_ORIGIN}/set-password`;
      console.log(
        "Redirecting to set-password (expecting cookie):",
        redirectUrl
      );
    } else {
      redirectUrl = `${process.env.CLIENT_ORIGIN}/homepage`;
      console.log("Redirecting to homepage (cookie set):", redirectUrl);
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in googleCallback:", error);
    res.redirect(
      `${process.env.CLIENT_ORIGIN}/login?error=internal_server_error`
    );
  }
};

// Modified middleware to protect the setPassword route
const protectSetPassword = (req, res, next) => {
  let token;

  console.log("Inside protectSetPassword middleware");
  console.log("Request Cookies:", req.cookies);
  console.log("Request Query:", req.query);
  console.log("Request Headers:", req.headers.authorization);

  // 1. Check for token in cookies (primary)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token found in cookie:", token);
  }

  // 2. Fallback: Query parameter (less likely now but kept for robustness)
  if (!token && req.query.token) {
    token = req.query.token;
    console.log("Token found in query parameter (fallback):", token);
  }

  // 3. Fallback: Authorization header (Bearer token)
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token found in Authorization header (fallback):", token);
  }

  if (!token) {
    console.error(
      "ProtectSetPassword: No token found in cookie, query, or header. Rejecting request."
    );
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    console.log("Attempting to verify token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("ProtectSetPassword: Token verified successfully:", decoded);
    // *** Gắn user_id vào req object với tên khác để tránh ghi đè req.user ***
    req.authenticatedUserId = decoded.user_id;
    console.log(
      "ProtectSetPassword: Attached authenticatedUserId:",
      req.authenticatedUserId
    );

    next();
  } catch (error) {
    console.error(
      "ProtectSetPassword: Token verification failed:",
      error.message
    );
    if (req.cookies.token) {
      res.clearCookie("token");
      console.log("ProtectSetPassword: Cleared invalid cookie.");
    }
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Set password for a user (e.g., after Google login)
exports.setPassword = [
  protectSetPassword, // Use the custom middleware
  async (req, res) => {
    const { password } = req.body;

    // *** Lấy user_id từ req.authenticatedUserId ***
    const userId = req.authenticatedUserId;

    // Ensure user ID is available from middleware
    if (!userId) {
      // Check for userId directly
      console.error(
        "setPassword handler: authenticatedUserId not found in req."
      );
      return res
        .status(401)
        .json({ message: "Authentication failed, user ID missing" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        console.error(
          `setPassword handler: User not found with ID from token: ${userId}`
        );
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password_hash = hashedPassword;
      await user.save();

      res.json({ message: "Mật khẩu đã được thiết lập thành công." });
    } catch (error) {
      console.error("Error setting password:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi khi thiết lập mật khẩu." });
    }
  },
];

// ... (Hàm protect ban đầu, nếu có sử dụng ở route khác) ...
exports.protect = (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { user_id: decoded.user_id, role: decoded.role };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// New: Get logged-in user profile
