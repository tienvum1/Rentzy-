const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config(); // Load biến môi trường từ .env

// Debug: In các biến môi trường để kiểm tra
console.log("Cloudinary config loaded:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log(
  "Reading API_SECRET from process.env:",
  process.env.CLOUDINARY_API_SECRET
); // Log giá trị đọc từ process.env

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});
console.log("Cloudinary SDK configured with:", cloudinary.config());

module.exports = cloudinary;
