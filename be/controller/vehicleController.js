const mongoose = require("mongoose");
const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');

const Vehicle = require("../models/Vehicle");
const User = require('../models/User');
const Booking = require('../models/Booking');

const cloudinary = require("../utils/cloudinary");
const Notification = require('../models/Notification');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory for processing
const upload = multer({ storage: storage }); // Keep storage config

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageFile) => {
  if (!imageFile) return null;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "vehicles" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(imageFile.buffer);
  });
};
// Add new function to get vehicles owned by the authenticated user
exports.getOwnerVehicles = async (req, res) => {
  const ownerId = req.user ? req.user._id : null;
  if (!ownerId) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  try {
    // Only fetch vehicles from Vehicle model, no joins
    const ownerVehicles = await Vehicle.find({ owner: ownerId }).populate('owner', 'name email');
    res.status(200).json({ count: ownerVehicles.length, vehicles: ownerVehicles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owner vehicles.", error: error.message });
  }
};
// Add New Vehicle Handler
exports.addVehicle = async (req, res) => {
  try {
    // Lấy dữ liệu từ form
    const {
      brand, model, licensePlate, location, pricePerDay,
      seatCount, bodyType, transmission, fuelType, fuelConsumption,
      features, description
    } = req.body;

    // Validate các trường bắt buộc (không có deposit, rentalPolicy)
    if (!brand || !model || !licensePlate || !location || !pricePerDay ||
        !seatCount || !bodyType || !transmission || !fuelType || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin xe.' });
    }

    // Validate file giấy tờ xe
    if (!req.files || !req.files.vehicleDocument || !req.files.vehicleDocument[0]) {
      return res.status(400).json({ message: 'Vui lòng upload giấy tờ xe.' });
    }

    // Upload ảnh chính
    let main_image_url = '';
    if (req.files && req.files.main_image) {
      main_image_url = await uploadImageToCloudinary(req.files.main_image[0]);
    }
    // Upload ảnh phụ
    let additional_images_urls = [];
    if (req.files && req.files.additional_images) {
      for (const file of req.files.additional_images) {
        const url = await uploadImageToCloudinary(file);
        additional_images_urls.push(url);
      }
    }
    // Upload giấy tờ xe
    let vehicleDocumentUrl = '';
    if (req.files && req.files.vehicleDocument) {
      vehicleDocumentUrl = await uploadImageToCloudinary(req.files.vehicleDocument[0]);
    }

    // Xử lý location: nếu là JSON hợp lệ thì parse, nếu không thì giữ nguyên chuỗi
    let parsedLocation = location;
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {}

    // Tạo vehicle mới
    const newVehicle = new Vehicle({
      brand,
      model,
      licensePlate,
      location: parsedLocation,
      pricePerDay,
      seatCount,
      bodyType,
      transmission,
      fuelType,
      fuelConsumption,
      features: Array.isArray(features) ? features : [features],
      primaryImage: main_image_url,
      gallery: additional_images_urls,
      vehicleDocument: vehicleDocumentUrl,
      description,
      owner: req.user._id
    });

    await newVehicle.save();

    // Gửi notification cho tất cả admin
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        type: 'vehicle',
        title: 'Xe mới chờ duyệt',
        message: `Xe ${newVehicle.brand} ${newVehicle.model} vừa được thêm, cần duyệt.`,
        vehicle: newVehicle._id,
        forAdmin: true
      });
    }

    res.status(201).json({ message: 'Xe đã được thêm thành công! Chờ admin duyệt.', vehicle: newVehicle });
  } catch (error) {
    console.error('Lỗi khi thêm xe:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi thêm xe.', error: error.message });
  }
};

// Add function to update a vehicle and associated data
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand,
      model,
      licensePlate,
      location,
      pricePerDay,
      seatCount,
      bodyType,
      transmission,
      fuelType,
      fuelConsumption,
      features,
      description
    } = req.body;

    // Validate các trường bắt buộc (bỏ deposit, rentalPolicy)
    if (!brand || !model || !licensePlate || !location || !pricePerDay ||
        !seatCount || !bodyType || !transmission || !fuelType || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin xe.' });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // Xử lý ảnh (nếu có upload)
    let main_image_url = vehicle.primaryImage;
    let additional_images_urls = vehicle.gallery || [];

    // Nếu có file main_image mới thì upload và cập nhật
    if (req.files && req.files.main_image && req.files.main_image.length > 0) {
      main_image_url = await uploadImageToCloudinary(req.files.main_image[0]);
    }

    // Nếu clear_gallery=true thì xóa hết gallery
    if (req.body.clear_gallery === 'true') {
      additional_images_urls = [];
    } else if (req.files && req.files.additional_images && req.files.additional_images.length > 0) {
      // Nếu có file ảnh phụ mới thì upload và thay thế toàn bộ gallery
      additional_images_urls = [];
      for (const file of req.files.additional_images) {
        const url = await uploadImageToCloudinary(file);
        additional_images_urls.push(url);
      }
    }

    // Xử lý giấy tờ xe (vehicleDocument)
    let vehicleDocumentUrl = vehicle.vehicleDocument;
    if (req.files && req.files.vehicleDocument && req.files.vehicleDocument.length > 0) {
      vehicleDocumentUrl = await uploadImageToCloudinary(req.files.vehicleDocument[0]);
    }

    // Xử lý location: nếu là JSON hợp lệ thì parse, nếu không thì giữ nguyên chuỗi
    let parsedLocation = location;
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      // Nếu không phải JSON, giữ nguyên chuỗi
    }

    // Cập nhật vehicle (bỏ deposit, rentalPolicy)
    vehicle.brand = brand;
    vehicle.model = model;
    vehicle.licensePlate = licensePlate;
    vehicle.location = parsedLocation;
    vehicle.pricePerDay = pricePerDay;
    vehicle.seatCount = seatCount;
    vehicle.bodyType = bodyType;
    vehicle.transmission = transmission;
    vehicle.fuelType = fuelType;
    vehicle.fuelConsumption = fuelConsumption;
    vehicle.features = Array.isArray(features) ? features : [features];
    vehicle.primaryImage = main_image_url;
    vehicle.gallery = additional_images_urls;
    vehicle.vehicleDocument = vehicleDocumentUrl;
    vehicle.description = description;

    // Khi cập nhật xe, chuyển trạng thái duyệt về 'pending' để admin duyệt lại
    vehicle.approvalStatus = 'pending';

    await vehicle.save();

    // Gửi notification cho tất cả admin
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        type: 'vehicle',
        title: 'Xe cập nhật chờ duyệt',
        message: `Xe ${vehicle.brand} ${vehicle.model} vừa được cập nhật, cần duyệt lại.`,
        vehicle: vehicle._id,
        forAdmin: true
      });
    }

    res.status(200).json({ message: 'Cập nhật xe thành công! Chờ admin duyệt lại.', vehicle });
  } catch (error) {
    console.error('Lỗi khi cập nhật xe:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật xe.', error: error.message });
  }
};

// Chủ xe khoá/mở khoá xe của mình
exports.updateVehicleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ownerId = req.user._id;

  try {
    // Kiểm tra tính hợp lệ của status
    const allowedStatuses = ["available", "blocked"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    const vehicle = await Vehicle.findOne({ _id: id, owner: ownerId });

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe hoặc bạn không phải chủ xe." });
    }

    vehicle.status = status;
    await vehicle.save();

    res.status(200).json({ message: `Xe đã được ${status === "blocked" ? "khoá" : "mở khoá"} thành công!`, vehicle });
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật trạng thái xe.", error: error.message });
  }
};

// Lấy danh sách xe đã được duyệt và đang sẵn sàng cho thuê
exports.getApprovedVehicles = async (req, res) => {
  try {
    // Chỉ lấy xe đã duyệt và đang available
    const vehicles = await Vehicle.find({ approvalStatus: "approved", status: "available" }).populate('owner', 'name email');
    res.status(200).json({ vehicles, count: vehicles.length });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách xe đã duyệt.", error: error.message });
  }
};

// Add function to get a single vehicle by ID 
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id).populate('owner', 'name email');
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }
    res.status(200).json({ vehicle });
  } catch (error) {
    console.error("Error getting vehicle by ID:", error);
    res.status(500).json({
      message: "Failed to fetch vehicle details.",
      error: error.message,
    });
  }
};

// tìm kiếm xe 
exports.filterVehicles = async (req, res) => {
  try {
    const { brand, seatCount, bodyType, transmission, fuelType } = req.query;
    let filter = {};
    if (brand) filter.brand = brand;
    if (seatCount) filter.seatCount = Number(seatCount);
    if (bodyType) filter.bodyType = bodyType;
    if (transmission) filter.transmission = transmission;
    if (fuelType) filter.fuelType = fuelType;

    const vehicles = await Vehicle.find(filter);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API: Top 10 xe có rentalCount cao nhất
exports.getTopRentedVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ rentalCount: -1 })
      .limit(10);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// API đơn giản chỉ cần thời gian thuê để tìm xe có rảnh
exports.searchVehiclesByTime = async (req, res) => {
  try {
    const {
      pickupDate,
      pickupTime,
      returnDate,
      returnTime
    } = req.body;

    // Validate required parameters
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin thời gian thuê xe"
      });
    }

    // Parse dates and times
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);

    // Find vehicles that are available and have a booking that overlaps
    const overlappingBookings = await Booking.find({
      vehicle: { $in: req.params.id }, // Assuming req.params.id is the vehicle ID
      $or: [
        {
          pickupDateTime: { $lte: returnDateTime },
          returnDateTime: { $gte: pickupDateTime }
        },
        {
          pickupDateTime: { $gte: pickupDateTime },
          returnDateTime: { $lte: returnDateTime }
        }
      ]
    });

    // If there are overlapping bookings, the vehicle is not available
    if (overlappingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Xe đã được đặt trong khoảng thời gian này."
      });
    }

    // If no overlapping bookings, the vehicle is available for the requested time
    res.status(200).json({
      success: true,
      message: "Xe có rảnh trong khoảng thời gian này."
    });
  } catch (error) {
    console.error("Error searching vehicles by time:", error);
    res.status(500).json({
      message: "Failed to search vehicles by time.",
      error: error.message,
    });
  }
};

exports.getVehiclesByOwnerId = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const vehicles = await Vehicle.find({ owner: ownerId, status: 'available', approvalStatus: 'approved' });
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách xe của chủ xe.", error: error.message });
  }
};