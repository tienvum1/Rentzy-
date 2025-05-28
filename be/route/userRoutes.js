const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/profile", protect, userController.getProfile);

module.exports = router;
