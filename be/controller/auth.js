const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require("validator");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

// Helper function to generate JWT token and set cookie
const generateTokenAndSetCookie = (user, res) => {
  const token = jwt.sign(
    { user_id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // secure: process.env.NODE_ENV === 'production',
    // sameSite: 'Lax'
  });
};

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
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password_hash: hashedPassword,
      phone,
      is_verified: false,
      role: "renter",
      loginMethods: ['password'] // Set login method to password
    });

    await user.save();

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

// LOGIN (Email/Password)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and if password login is enabled for this account
    if (!user || !user.loginMethods.includes('password')) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified (optional based on your flow, but good practice)
    if (!user.is_verified)
      return res.status(400).json({ message: "Please verify your email" });

    // Check if password matches (only if password_hash exists)
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(user, res);

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Có thể trả về loginMethods nếu client cần biết
        // loginMethods: user.loginMethods,
      },
    });
  } catch (error) {
    console.error("Đăng nhập thất bại:", error);

    // Simplified error handling for production to prevent leaking info
    res.status(500).json({ message: "Đã xảy ra lỗi trong quá trình đăng nhập." });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  // Frontend chỉ cần xóa token
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

// GOOGLE LOGIN CALLBACK
exports.googleCallback = async (req, res) => {
  console.log("Inside googleCallback");
  console.log("req.user from Google strategy:", req.user);

  if (!req.user || !req.user.email) {
    console.error("Google authentication failed or email not provided");
    return res.redirect(
      `${process.env.CLIENT_ORIGIN}/login?error=google_auth_failed`
    );
  }

  const googleProfile = req.user; // This is the profile object from Passport-Google-OAuth2

  try {
    // 1. Find user by Google ID
    let user = await User.findOne({ googleId: googleProfile.id });

    if (user) {
      // User found by Google ID, implies existing Google login or already linked
      console.log("User found by googleId:", user._id);
      // Ensure loginMethods includes 'google' - might be redundant if user exists via googleId but safe
      if (!user.loginMethods.includes('google')) {
        user.loginMethods.push('google');
        await user.save();
      }
    } else {
      // 2. User not found by Google ID, try finding by email
      user = await User.findOne({ email: googleProfile.email });

      if (user) {
        // User found by email, implies existing email/password account (or previously google but googleId was somehow lost)
        console.log("User found by email, linking Google ID:", user._id);
        // Link Google ID to existing account if not already linked
        if (!user.googleId) {
          user.googleId = googleProfile.id;
        }
        // Ensure loginMethods includes 'google'
        if (!user.loginMethods.includes('google')) {
          user.loginMethods.push('google');
        }
        // Update name/avatar if they are empty and provided by Google (optional)
        if (!user.name && googleProfile.displayName) user.name = googleProfile.displayName;
        if (!user.avatar_url && googleProfile.photos && googleProfile.photos[0]) user.avatar_url = googleProfile.photos[0].value;

        await user.save();

      } else {
        // 3. User not found by Google ID or email, create new account (auto sign-up)
        console.log("New user via Google, creating account:", googleProfile.email);
        user = new User({
          name: googleProfile.displayName,
          email: googleProfile.email,
          googleId: googleProfile.id,
          is_verified: true, // Assume email from Google is verified
          role: "renter", // Default role
          avatar_url: googleProfile.photos && googleProfile.photos[0] ? googleProfile.photos[0].value : null,
          loginMethods: ['google'] // Set login method to google
        });
        await user.save();
      }
    }

    // After finding/creating/linking the user, generate token and redirect
    generateTokenAndSetCookie(user, res);

    // Redirect logic (simplified - always redirect to homepage)
    const redirectUrl = `${process.env.CLIENT_ORIGIN}/homepage`;
    console.log("Redirecting to homepage after Google auth:", redirectUrl);
    res.redirect(redirectUrl);

  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=google_auth_failed_server`);
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
