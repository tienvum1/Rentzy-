// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

 const  protect = (req, res, next) => {
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

module.exports = {
  protect,
  adminOnly,
};
