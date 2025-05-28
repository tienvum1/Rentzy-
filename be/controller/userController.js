const User = require("../models/User");
const dotenv = require("dotenv");
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
