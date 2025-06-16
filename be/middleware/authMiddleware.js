// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token found in cookie:", token);
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.user_id, role: decoded.role };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role && Array.isArray(req.user.role) && req.user.role.includes('admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

const verifyRenterRequirements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.is_phone_verified) {
      return res.status(403).json({ 
        message: "Phone number verification required",
        requiresPhoneVerification: true
      });
    }

    if (user.driver_license_verification_status !== 'verified') {
      return res.status(403).json({ 
        message: "Driver's license verification required",
        requiresLicenseVerification: true
      });
    }

    next();
  } catch (error) {
    console.error("Error in verifyRenterRequirements:", error);
    res.status(500).json({ message: "Error checking renter requirements" });
  }
};

module.exports = {
  protect,
  adminOnly,
  verifyRenterRequirements
};
