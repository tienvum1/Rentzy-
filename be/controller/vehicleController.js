const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/vehicleController');
// You will likely need middleware for authentication and file uploads
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');

const Vehicle = require("../models/Vehicle");
// const Car = require("../models/Car");
// const Motorbike = require("../models/Motorbike");
// VehicleImage model is no longer strictly necessary for storing URLs based on the latest schema,
// as primaryImage and gallery are on the Vehicle schema itself. Keep if still used elsewhere.
// const VehicleImage = require('../models/VehicleImage');

const cloudinary = require("../utils/cloudinary");

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
      brand, model, licensePlate, location, pricePerDay, deposit,
      seatCount, bodyType, transmission, fuelType, features, rentalPolicy, description,fuelConsumption
    } = req.body;
    console.log(req.body)

    // Validate các trường bắt buộc
    if (!brand || !model || !licensePlate || !location || !pricePerDay || !deposit ||
        !seatCount || !bodyType || !transmission || !fuelType || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin xe.' });
    }

    // Xử lý ảnh (nếu có upload)
    let main_image_url = '';
    let additional_images_urls = [];
    if (req.files && req.files.main_image) {
      main_image_url = await uploadImageToCloudinary(req.files.main_image[0]);
    }
    if (req.files && req.files.additional_images) {
      for (const file of req.files.additional_images) {
        const url = await uploadImageToCloudinary(file);
        additional_images_urls.push(url);
      }
    }

    // Xử lý location: nếu là JSON hợp lệ thì parse, nếu không thì giữ nguyên chuỗi
    let parsedLocation = location;
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      // Nếu không phải JSON, giữ nguyên chuỗi
    }

    // Tạo vehicle mới
    const newVehicle = new Vehicle({
      brand,
      model,
      licensePlate,
      location: parsedLocation,
      pricePerDay,
      deposit,
      seatCount,
      bodyType,
      transmission,
      fuelType,
      fuelConsumption,
      features: Array.isArray(features) ? features : [features],
      primaryImage: main_image_url,
      gallery: additional_images_urls,
      rentalPolicy,
      description,
      owner: req.user._id // Lấy từ middleware xác thực
    });

    await newVehicle.save();

    res.status(201).json({ message: 'Xe đã được thêm thành công!', vehicle: newVehicle });
  } catch (error) {
    console.error('Lỗi khi thêm xe:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi thêm xe.' });
  }
};
// Add function to get a single vehicle by ID (chỉ lấy từ Vehicle, không join car/motorbike)
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
      deposit,
      seatCount,
      bodyType,
      transmission,
      fuelType,
      fuelConsumption,
      features,
      rentalPolicy,
      description
    } = req.body;

    // Validate các trường bắt buộc
    if (!brand || !model || !licensePlate || !location || !pricePerDay || !deposit ||
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
    if (req.body.clear_gallery === 'true') {
      additional_images_urls = [];
    } else if (req.files && req.files.additional_images && req.files.additional_images.length > 0) {
      additional_images_urls = [];
      for (const file of req.files.additional_images) {
        const url = await uploadImageToCloudinary(file);
        additional_images_urls.push(url);
      }
    }

    // Xử lý location: nếu là JSON hợp lệ thì parse, nếu không thì giữ nguyên chuỗi
    let parsedLocation = location;
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      // Nếu không phải JSON, giữ nguyên chuỗi
    }

    // Cập nhật vehicle
    vehicle.brand = brand;
    vehicle.model = model;
    vehicle.licensePlate = licensePlate;
    vehicle.location = parsedLocation;
    vehicle.pricePerDay = pricePerDay;
    vehicle.deposit = deposit;
    vehicle.seatCount = seatCount;
    vehicle.bodyType = bodyType;
    vehicle.transmission = transmission;
    vehicle.fuelType = fuelType;
    vehicle.fuelConsumption = fuelConsumption;
    vehicle.features = Array.isArray(features) ? features : [features];
    vehicle.primaryImage = main_image_url;
    vehicle.gallery = additional_images_urls;
    vehicle.rentalPolicy = rentalPolicy;
    vehicle.description = description;

    await vehicle.save();

    res.status(200).json({ message: 'Cập nhật xe thành công!', vehicle });
  } catch (error) {
    console.error('Lỗi khi cập nhật xe:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật xe.' });
  }
};


// Add function to delete a vehicle and associated data
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the vehicle to get its type before deletion
    const vehicleToDelete = await Vehicle.findById(id);

    if (!vehicleToDelete) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Delete the main vehicle entry
    await Vehicle.findByIdAndDelete(id);

    // Delete associated specific details (Car or Motorbike)
    if (vehicleToDelete.type === "car") {
      await Car.deleteOne({ vehicle: id }); // Corrected foreignField to 'vehicle'
    } else if (vehicleToDelete.type === "motorbike") {
      await Motorbike.deleteOne({ vehicle: id }); // Corrected foreignField to 'vehicle'
    }

    // Note: Images are now stored directly on the Vehicle model (primaryImage, gallery),
    // so explicit deletion of VehicleImage model entries might not be needed if that model is deprecated.
    // If VehicleImage is still used for other purposes or relationships, keep the line below.
    // await VehicleImage.deleteMany({ vehicle_id: id });

    res.status(200).json({ message: "Vehicle deleted successfully!" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res
      .status(500)
      .json({ message: "Failed to delete vehicle.", error: error.message });
  }
};



// Add function to get all vehicles (potentially with filters/pagination in req.query)
exports.getVehicles = async (req, res) => {
  try {
    // Basic find, populate owner, potentially filter/sort based on query params
    // The aggregation pipeline below provides comprehensive joining with Car/Motorbike/Owner/Images
    const vehicles = await Vehicle.aggregate([
      {
        $lookup: {
          from: "cars", // The collection name for Car model
          let: { vehicleId: "$_id" }, // Define a variable for the local field
          pipeline: [
            { $match: { $expr: { $eq: ["$vehicle", "$$vehicleId"] } } }, // Match car by vehicle ID
          ],
          as: "carDetails",
        },
      },
      {
        $lookup: {
          from: "motorbikes", // The collection name for Motorbike model
          let: { vehicleId: "$_id" }, // Define a variable for the local field
          pipeline: [
            { $match: { $expr: { $eq: ["$vehicle", "$$vehicleId"] } } }, // Match motorbike by vehicle ID
          ],
          as: "motorbikeDetails",
        },
      },
      // Note: VehicleImage model might be deprecated based on comments,
      // using primaryImage and gallery arrays on Vehicle model instead.
      // If VehicleImage is still needed, uncomment and adjust the lookup below.
      /*
            {
                $lookup: {
                    from: 'vehicleimages', // The collection name for VehicleImage model
                    localField: '_id',
                    foreignField: 'vehicle_id',
                    as: 'images' // This will be an array of image documents
                }
            },
            */
      {
        $lookup: {
          from: "users", // The collection name for User model
          localField: "owner", // Corrected localField to 'owner' to match Vehicle schema
          foreignField: "_id",
          as: "ownerDetails", // Renamed to avoid conflict with 'owner' field in Vehicle
        },
      },
      {
        $addFields: {
          // Flatten the arrays from lookups
          carDetails: { $arrayElemAt: ["$carDetails", 0] },
          motorbikeDetails: { $arrayElemAt: ["$motorbikeDetails", 0] },
          ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }, // Get the single owner document
        },
      },
      {
        $project: {
          // Exclude fields you don't need or restructure
          _id: 1,
          owner: "$ownerDetails", // Include the full owner details object
          brand: 1,
          model: 1,
          type: 1,
          licensePlate: 1,
          location: 1,
          isAvailable: 1, // Corrected field name
          pricePerDay: 1, // Corrected field name
          deposit: 1, // Corrected field name
          fuelConsumption: 1, // Corrected field name
          features: 1, // Corrected field name
          rentalPolicy: 1, // Corrected field name
          primaryImage: 1, // Include primary image URL
          gallery: 1, // Include gallery image URLs
          approvalStatus: 1, // Include approval status
          status: 1, // Include general vehicle status
          createdAt: 1,
          updatedAt: 1, // Include update timestamp
          description: 1,
          // Include all fields from carDetails and motorbikeDetails
          "carDetails.seatCount": 1, // Corrected field name
          "carDetails.bodyType": 1, // Corrected field name
          "carDetails.transmission": 1,
          "carDetails.fuelType": 1, // Corrected field name
          "motorbikeDetails.engineCapacity": 1, // Corrected field name
          "motorbikeDetails.hasGear": 1, // Corrected field name
          // If using VehicleImage, include 'images' here:
          // images: 1,
        },
      },
      // Add optional stages for filtering, sorting, pagination based on req.query
      // Example filtering:
      // { $match: { type: req.query.type } }
      // Example sorting:
      // { $sort: { pricePerDay: parseInt(req.query.sortByPrice) } }
      // Example pagination:
      // { $skip: parseInt(req.query.skip) }, { $limit: parseInt(req.query.limit) }
    ]);

    res.status(200).json({ count: vehicles.length, vehicles });
  } catch (error) {
    console.error("Error getting vehicles:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch vehicles.", error: error.message });
  }
};



// @desc    Admin reviews a vehicle approval request
// @route   PUT /api/admin/vehicles/review/:vehicleId
// @access  Private/Admin
exports.reviewVehicleApproval = async (req, res) => {
  console.log(
    "Review Vehicle Approval Request:",
    req.params.vehicleId,
    req.body
  );

  const { vehicleId } = req.params;
  const { status, rejectionReason } = req.body; // status should be 'approved' or 'rejected'

  // Basic validation for status
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  try {
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Optional: Prevent reviewing vehicles that are not pending (depends on desired workflow)
    // if (vehicle.approvalStatus !== 'pending') {
    //     return res.status(400).json({ message: 'Vehicle is not pending approval.' });
    // }

    // Update the approval status
    vehicle.approvalStatus = status;

    // Store rejection reason if status is rejected
    if (status === "rejected") {
      vehicle.rejectionReason = rejectionReason || null; // Store reason, allow null if none provided
    } else {
      vehicle.rejectionReason = null; // Clear rejection reason if approved
    }

    await vehicle.save();

    // TODO: Optionally notify the owner about the approval/rejection

    res
      .status(200)
      .json({ message: `Vehicle ${vehicleId} has been ${status}.` });
  } catch (error) {
    console.error("Error reviewing vehicle approval:", error);
    res
      .status(500)
      .json({
        message: "Failed to review vehicle approval.",
        error: error.message,
      });
  }
};

// Add function to request vehicle update
exports.requestVehicleUpdate = async (req, res) => {
  console.log("Request Vehicle Update Body:", req.body);
  const { id } = req.params;
  const {
    brand,
    model,
    licensePlate,
    location: rawLocation, // Đổi tên để tránh nhầm lẫn với biến đã parse
    pricePerDay,
    deposit,
    fuelConsumption,
    features,
    rentalPolicy,
    type,
    description,
    ...specificData
  } = req.body;

  try {
    // Find the vehicle to check its type and ownership
    const vehicleToUpdate = await Vehicle.findById(id);

    if (!vehicleToUpdate) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Check if the user is the owner of the vehicle
    if (vehicleToUpdate.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this vehicle." });
    }

    // Check if there's already a pending change
    if (vehicleToUpdate.pendingChangeStatus === "pending") {
      return res.status(400).json({ message: "There is already a pending change for this vehicle." });
    }

    // Parse location data
    let parsedLocation = rawLocation;
    if (typeof rawLocation === 'string' && rawLocation.startsWith('{')) {
      try {
        parsedLocation = JSON.parse(rawLocation).address; // Lấy chỉ trường address
      } catch (e) {
        console.warn("Could not parse location JSON, using raw value:", rawLocation);
        parsedLocation = rawLocation; // Fallback if parsing fails
      }
    } else if (typeof rawLocation === 'object' && rawLocation.address) {
      parsedLocation = rawLocation.address;
    }

    // Helper function to safely get a single value from req.body (handles arrays)
    const getSingleValue = (value) => {
      return Array.isArray(value) ? value[0] : value;
    };

    // Prepare the pending changes object
    const pendingChanges = {
      brand,
      model,
      location: parsedLocation, // Sử dụng giá trị location đã parse
      pricePerDay: parseFloat(getSingleValue(pricePerDay)),
      deposit: parseFloat(getSingleValue(deposit)),
      fuelConsumption: getSingleValue(fuelConsumption) ? parseFloat(getSingleValue(fuelConsumption)) : undefined,
      features: Array.isArray(features) ? features : (getSingleValue(features) ? JSON.parse(getSingleValue(features)) : []), // Handle features correctly
      rentalPolicy: getSingleValue(rentalPolicy),
      description: getSingleValue(description),
      specificDetails: {}
    };

    // Debugging: Log features after parsing and before assigning to pendingChanges
    console.log('DEBUG: Features used for pendingChanges:', pendingChanges.features);

    // Add specific details based on vehicle type
    if (vehicleToUpdate.type === "car") {
      pendingChanges.specificDetails = {
        seatCount: parseInt(getSingleValue(specificData.seatCount), 10),
        bodyType: getSingleValue(specificData.bodyType),
        transmission: getSingleValue(specificData.transmission) ? getSingleValue(specificData.transmission).toLowerCase() : '',
        fuelType: getSingleValue(specificData.fuelType) ? getSingleValue(specificData.fuelType).toLowerCase() : '',
      };
    } else if (vehicleToUpdate.type === "motorbike") {
      pendingChanges.specificDetails = {
        engineCapacity: parseFloat(getSingleValue(specificData.engineCapacity)),
        hasGear: getSingleValue(specificData.hasGear) === 'true' // Chuyển đổi string 'true'/'false' sang boolean
      };
    }

    // Handle image updates if provided
    if (req.files) {
      if (req.files.main_image && req.files.main_image.length > 0) {
        try {
          pendingChanges.primaryImage = await uploadImageToCloudinary(req.files.main_image[0]);
        } catch (error) {
          console.error("Error uploading main image:", error);
          return res.status(500).json({ message: "Failed to upload main image.", error: error.message });
        }
      }

      if (req.files.additional_images && req.files.additional_images.length > 0) {
        const galleryImageUrls = [];
        for (const file of req.files.additional_images) {
          try {
            const imageUrl = await uploadImageToCloudinary(file);
            galleryImageUrls.push(imageUrl);
          } catch (error) {
            console.error("Error uploading additional image:", error);
          }
        }
        if (galleryImageUrls.length > 0) {
          pendingChanges.gallery = galleryImageUrls;
        }
      }
    }

    // Update the vehicle with pending changes
    vehicleToUpdate.pendingChanges = pendingChanges;
    vehicleToUpdate.pendingChangeStatus = "pending";
    vehicleToUpdate.changeRejectionReason = null;

    await vehicleToUpdate.save();

    res.status(200).json({
      message: "Vehicle update request submitted successfully. Waiting for admin approval.",
      vehicle: vehicleToUpdate
    });
  } catch (error) {
    console.error("Error requesting vehicle update:", error);
    res.status(500).json({ message: "Failed to submit vehicle update request.", error: error.message });
  }
};

// Add function to get vehicles with pending changes for admin review
exports.getVehiclesWithPendingChanges = async (req, res) => {
  try {
    const vehiclesWithPendingChanges = await Vehicle.aggregate([
      { $match: { pendingChangeStatus: "pending" } },
      {
        $lookup: {
          from: "cars",
          let: { vehicleId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$vehicle", "$$vehicleId"] } } }
          ],
          as: "carDetails"
        }
      },
      {
        $lookup: {
          from: "motorbikes",
          let: { vehicleId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$vehicle", "$$vehicleId"] } } }
          ],
          as: "motorbikeDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails"
        }
      },
      {
        $addFields: {
          carDetails: { $arrayElemAt: ["$carDetails", 0] },
          motorbikeDetails: { $arrayElemAt: ["$motorbikeDetails", 0] },
          ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }
        }
      },
      {
        $project: {
          _id: 1,
          owner: 1,
          brand: 1,
          model: 1,
          type: 1,
          licensePlate: 1,
          location: 1,
          pricePerDay: 1,
          deposit: 1,
          fuelConsumption: 1,
          features: 1,
          rentalPolicy: 1,
          primaryImage: 1,
          gallery: 1,
          approvalStatus: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          pendingChanges: 1, // Explicitly include pendingChanges
          description: 1,
          specificDetails: {
            $cond: {
              if: { $eq: ["$type", "car"] },
              then: "$carDetails",
              else: {
                $cond: {
                  if: { $eq: ["$type", "motorbike"] },
                  then: "$motorbikeDetails",
                  else: null,
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      count: vehiclesWithPendingChanges.length,
      vehicles: vehiclesWithPendingChanges
    });
  } catch (error) {
    console.error("Error getting vehicles with pending changes:", error);
    res.status(500).json({
      message: "Failed to fetch vehicles with pending changes.",
      error: error.message
    });
  }
};

// Add function for admin to review vehicle changes
exports.reviewVehicleChanges = async (req, res) => {
  const vehicleIdString = req.params.vehicleId;
  console.log("DEBUG: vehicleId from req.params (string, before validation):", vehicleIdString); 
  const { status, rejectionReason } = req.body;

  // Validate the ID format before conversion
  if (!mongoose.Types.ObjectId.isValid(vehicleIdString)) {
    console.error("Invalid ObjectId format provided for vehicleId:", vehicleIdString);
    return res.status(400).json({ message: "Invalid Vehicle ID format provided." });
  }

  const objectVehicleId = new mongoose.Types.ObjectId(vehicleIdString);
  console.log("DEBUG: vehicleId as Mongoose ObjectId (after conversion):", objectVehicleId);

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  try {
    console.log("DEBUG: Attempting to query Vehicle with _id:", objectVehicleId);
    let vehicle = await Vehicle.findOne({ _id: objectVehicleId }); // Use let for re-assignment
    console.log("DEBUG: Retrieved Vehicle object (before modifications):", vehicle);

    if (!vehicle) {
      console.error(`Vehicle not found for query ID: ${objectVehicleId.toString()}. This ID was derived from req.params. Check database consistency.`);
      return res.status(404).json({ message: "Vehicle not found with the provided ID. Please check the ID in the database." });
    }

    if (vehicle.pendingChangeStatus !== "pending") {
      return res.status(400).json({ message: "No pending changes to review." });
    }

    // Prepare the update operations for the main Vehicle document
    let updateOperations = {};
    let carUpdate = null; // To hold update for Car model
    let motorbikeUpdate = null; // To hold update for Motorbike model

    if (status === "approved") {
        const changesToApply = vehicle.pendingChanges.toObject 
          ? vehicle.pendingChanges.toObject({ getters: true, virtuals: false }) 
          : JSON.parse(JSON.stringify(vehicle.pendingChanges));
        
        console.log("DEBUG: changesToApply (plain object) before application:", changesToApply);

        // Ensure _id is not present on specificDetails within the changes being applied
        if (changesToApply.specificDetails && changesToApply.specificDetails._id) {
            console.warn("DEBUG: Found _id in changesToApply.specificDetails, deleting it.");
            delete changesToApply.specificDetails._id;
        }
        // Also ensure _id is not present on the pendingChanges object itself if it was somehow added
        if (changesToApply._id) {
            console.warn("DEBUG: Found _id in changesToApply root, deleting it.");
            delete changesToApply._id;
        }

        // Fields to be $set on the main Vehicle document
        updateOperations.$set = {
            brand: changesToApply.brand,
            model: changesToApply.model,
            location: changesToApply.location,
            pricePerDay: changesToApply.pricePerDay,
            deposit: changesToApply.deposit,
            fuelConsumption: changesToApply.fuelConsumption,
            features: changesToApply.features,
            rentalPolicy: changesToApply.rentalPolicy,
            primaryImage: changesToApply.primaryImage, // Apply new image if present
            gallery: changesToApply.gallery,           // Apply new gallery if present
            description: changesToApply.description,   // Apply new description
            pendingChangeStatus: "approved",
            changeRejectionReason: null,
        };
        // Use $unset to remove the pendingChanges field from the document
        updateOperations.$unset = { pendingChanges: "" }; 

        // Prepare updates for type-specific details
        if (vehicle.type === "car" && changesToApply.specificDetails) {
          carUpdate = Car.findOneAndUpdate(
            { vehicle: objectVehicleId },
            {
              seatCount: changesToApply.specificDetails.seatCount,
              bodyType: changesToApply.specificDetails.bodyType,
              transmission: changesToApply.specificDetails.transmission,
              fuelType: changesToApply.specificDetails.fuelType
            },
            { new: true, upsert: true } // Use upsert: true to create if not exists
          );
        } else if (vehicle.type === "motorbike" && changesToApply.specificDetails) {
          motorbikeUpdate = Motorbike.findOneAndUpdate(
            { vehicle_id: objectVehicleId }, // Corrected from 'vehicle' to 'vehicle_id'
            {
              engine_capacity: changesToApply.specificDetails.engineCapacity, // Corrected field name
              has_gear: changesToApply.specificDetails.hasGear // Corrected field name
            },
            { new: true, upsert: true } // Use upsert: true to create if not exists
          );
        }

    } else if (status === "rejected") {
        if (!rejectionReason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }
        updateOperations.$set = {
          pendingChangeStatus: "rejected",
          changeRejectionReason: rejectionReason
        };
        // Use $unset to remove the pendingChanges field from the document
        updateOperations.$unset = { pendingChanges: "" }; 
    }

    // Execute all updates in parallel
    const [finalUpdatedVehicle] = await Promise.all([
      Vehicle.findOneAndUpdate({ _id: objectVehicleId }, updateOperations, { new: true, runValidators: true }),
      carUpdate, // This will be null or a promise
      motorbikeUpdate // This will be null or a promise
    ].filter(Boolean)); // Filter out nulls if carUpdate/motorbikeUpdate are not set
    
    console.log("DEBUG: Final updated Vehicle document:", finalUpdatedVehicle);

    res.status(200).json({ message: `Changes ${status}d successfully` });
  } catch (error) {
    console.error("Error reviewing vehicle changes:", error);
    console.error("FULL ERROR OBJECT (reviewVehicleChanges catch block):", JSON.stringify(error, null, 2));
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ message: "Invalid Vehicle ID format provided." });
    }
    res.status(500).json({ message: "Failed to review vehicle changes." });
  }
};

// lấy tất cả vehicles approved
exports.updateVehicleStatus = async (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;
  const ownerId = req.user._id; // ID của chủ xe đã xác thực

  try {
    // Kiểm tra tính hợp lệ của status
    const allowedStatuses = ["available", "reserved", "rented", "maintenance", "blocked"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const vehicle = await Vehicle.findOne({ _id: id, owner: ownerId });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found or you are not the owner." });
    }

    // Cập nhật trạng thái xe và currentRenter
    vehicle.status = status;
    if (status === "rented" || status === "reserved") {
      if (!userId) {
        return res.status(400).json({ message: "userId is required when setting status to rented or reserved." });
      }
      vehicle.currentRenter = userId;
    } else if (status === "available") {
      vehicle.currentRenter = null;
    }
    // Các trạng thái khác giữ nguyên currentRenter

    await vehicle.save();

    res.status(200).json({ message: "Vehicle status updated successfully!", vehicle });
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({ message: "Failed to update vehicle status.", error: error.message });
  }
};

// Lấy danh sách xe đã được duyệt, có filter
exports.getApprovedVehicles = async (req, res) => {
  try {
    const {
      brand,
      model,
      location,
      seatCount,
      fuelType,
      transmission,
      startDate,
      endDate,
    } = req.query;

    // Xây dựng filter object
    const filter = { approvalStatus: "approved" };
    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (location) filter.location = location;
    if (seatCount) filter.seatCount = Number(seatCount);
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;

    // TODO: Nếu có filter ngày, cần xử lý logic kiểm tra xe có available trong khoảng đó không

    const vehicles = await Vehicle.find(filter).populate('owner', 'name email');
    res.status(200).json({ vehicles, count: vehicles.length });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách xe đã duyệt.", error: error.message });
  }
};
