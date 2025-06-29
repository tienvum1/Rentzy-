const mongoose = require("mongoose");

const Vehicle = require("../models/Vehicle");
const Car = require("../models/Car");
const Motorbike = require("../models/Motorbike");
// VehicleImage model is no longer strictly necessary for storing URLs based on the latest schema,
// as primaryImage and gallery are on the Vehicle schema itself. Keep if still used elsewhere.
// const VehicleImage = require('../models/VehicleImage');

const cloudinary = require("../utils/cloudinary");

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

// Add New Vehicle Handler
exports.addVehicle = async (req, res) => {
  console.log("Request Body Keys:", Object.keys(req.body));
  console.log(
    "Request Files Keys:",
    req.files ? Object.keys(req.files) : "No files"
  );

  const {
    brand,
    model,
    license_plate: licensePlate,
    location,
    description,
    price_per_day,
    deposit_required,
    fuelConsumption,
    type,
    seats,
    body_type,
    transmission,
    fuel_type,
    features,
    rentalPolicy,
  } = req.body;
  console.log("body lay tu req ", req.body);
  console.log("files", req.files);

  const ownerId = req.user ? req.user._id : null;
  console.log("ownerId", ownerId);
  if (!ownerId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  if (
    !brand ||
    brand.trim() === "" ||
    !model ||
    model.trim() === "" ||
    !licensePlate ||
    licensePlate.trim() === "" ||
    !location ||
    location.trim() === "" ||
    price_per_day === undefined ||
    price_per_day === null ||
    price_per_day.trim() === "" ||
    deposit_required === undefined ||
    deposit_required === null ||
    deposit_required.trim() === "" ||
    !type ||
    type.trim() === ""
  ) {
    return res
      .status(400)
      .json({ message: "Missing required general vehicle fields." });
  }

  const pricePerDayNum = parseFloat(price_per_day);
  const depositNum = parseFloat(deposit_required);
  const fuelConsumptionNum =
    fuelConsumption !== undefined &&
    fuelConsumption !== null &&
    fuelConsumption.trim() !== ""
      ? parseFloat(fuelConsumption)
      : undefined;

  try {
    let primaryImageUrl = "";
    const galleryImageUrls = [];

    if (req.files && req.files.main_image && req.files.main_image.length > 0) {
      try {
        primaryImageUrl = await uploadImageToCloudinary(
          req.files.main_image[0]
        );
      } catch (error) {
        console.error("Error uploading main image:", error);
        return res
          .status(500)
          .json({
            message: "Failed to upload main image.",
            error: error.message,
          });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Main image file is required.", field: "main_image" });
    }

    if (
      req.files &&
      req.files.additional_images &&
      req.files.additional_images.length > 0
    ) {
      for (const file of req.files.additional_images) {
        try {
          const imageUrl = await uploadImageToCloudinary(file);
          galleryImageUrls.push(imageUrl);
        } catch (error) {
          console.error("Error uploading additional image:", error);
        }
      }
    }

    const vehicle = new Vehicle({
      owner: ownerId,
      brand,
      model,
      type,
      licensePlate,
      location: location,
      description: description,
      pricePerDay: pricePerDayNum,
      deposit: depositNum,
      fuelConsumption: fuelConsumptionNum,
      features: features,
      rentalPolicy: Array.isArray(rentalPolicy)
        ? rentalPolicy.join("\n")
        : rentalPolicy,
      primaryImage: primaryImageUrl,
      gallery: galleryImageUrls,
    });

    await vehicle.save();

    if (type === "car") {
      const seatsNum = parseInt(seats, 10);

      const car = new Car({
        vehicle: vehicle._id,
        seatCount: seatsNum,
        bodyType: body_type,
        transmission: transmission.toLowerCase(),
        fuelType: fuel_type.toLowerCase(),
      });
      await car.save();
    } else if (type === "motorbike") {
      console.log(
        "Motorbike type received. Specific motorbike save logic should be added if needed."
      );
    }

    res.status(201).json({
      message: "Vehicle added successfully!",
      vehicleId: vehicle._id,
      primaryImage: primaryImageUrl,
      gallery: galleryImageUrls.length,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);

    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.licensePlate
    ) {
      return res
        .status(400)
        .json({
          message: "License plate already exists.",
          field: "licensePlate",
        });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res
      .status(500)
      .json({ message: "Failed to add vehicle.", error: error.message });
  }
};

// Add new function to get vehicles owned by the authenticated user
exports.getOwnerVehicles = async (req, res) => {
  console.log("Request User for getOwnerVehicles:", req.user);

  // Get owner ID from req.user (set by authMiddleware)
  const ownerId = req.user ? req.user._id : null; // Assuming _id is already an ObjectId or string valid for ObjectId

  if (!ownerId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Use aggregation to find vehicles by owner and join with specific details
    const ownerVehicles = await Vehicle.aggregate([
      // Stage 1: Match vehicles by the owner ID
      // Ensure ownerId is treated as ObjectId for the match stage
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },

      // Stage 2: Join with the 'cars' collection
      {
        $lookup: {
          from: "cars", // The name of the cars collection
          localField: "_id", // Field from the input documents (Vehicle)
          foreignField: "vehicle", // Field from the documents of the "from" collection (Car)
          as: "car_details", // Output array field name
        },
      },
      // $unwind deconstructs the array field. preserveNullAndEmptyArrays: true keeps vehicles without matching details (e.g., motorbikes).
      { $unwind: { path: "$car_details", preserveNullAndEmptyArrays: true } },

      // Stage 3: Join with the 'motorbikes' collection (if applicable)
      {
        $lookup: {
          from: "motorbikes", // The name of the motorbikes collection
          localField: "_id", // Field from the input documents (Vehicle)
          foreignField: "vehicle", // Field from the documents of the "from" collection (Motorbike)
          as: "motorbike_details", // Output array field name
        },
      },
      {
        $unwind: {
          path: "$motorbike_details",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Stage 4: Project the final output shape
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
          // Include specific details based on type
          specificDetails: {
            // Create a new field to hold car or motorbike details
            $cond: {
              // Use $cond to conditionally include car or motorbike details
              if: { $eq: ["$type", "car"] }, // If type is car
              then: "$car_details", // Include car details
              else: {
                // If not car, check if it's a motorbike
                $cond: {
                  if: { $eq: ["$type", "motorbike"] }, // If type is motorbike
                  then: "$motorbike_details", // Include motorbike details
                  else: null, // Otherwise, include null
                },
              },
            },
          },
        },
      },
      // You might add $sort, $skip, $limit stages here for pagination/sorting
    ]);

    res
      .status(200)
      .json({ count: ownerVehicles.length, vehicles: ownerVehicles });
  } catch (error) {
    console.error("Error getting owner vehicles:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch owner vehicles.",
        error: error.message,
      });
  }
};

// Rename and modify the function to get pending vehicle approvals for Admin
exports.getPendingVehicleApprovalsForAdmin = async (req, res) => {
  console.log("Request User for getPendingVehicleApprovalsForAdmin:", req.user);

  // Assuming admin check middleware (like adminOnly) is applied to this route,
  // so we don't need to check req.user.role here.

  try {
    // Use aggregation to find vehicles with pending approval status and join with specific details
    const pendingVehicles = await Vehicle.aggregate([
      // Stage 1: Match vehicles by the PENDING approval status
      // Use the approvalStatus field directly, not owner ID
      { $match: { approvalStatus: "pending" } }, // <--- Corrected match condition

      // Stage 2: Join with the 'cars' collection
      {
        $lookup: {
          from: "cars", // The name of the cars collection
          localField: "_id", // Field from the input documents (Vehicle)
          foreignField: "vehicle", // Field from the documents of the "from" collection (Car)
          as: "car_details", // Output array field name
        },
      },
      // $unwind deconstructs the array field. preserveNullAndEmptyArrays: true keeps vehicles without matching details (e.g., motorbikes).
      { $unwind: { path: "$car_details", preserveNullAndEmptyArrays: true } },

      // Stage 3: Join with the 'motorbikes' collection (if applicable)
      {
        $lookup: {
          from: "motorbikes", // The name of the motorbikes collection
          localField: "_id", // Field from the input documents (Vehicle)
          foreignField: "vehicle", // Field from the documents of the "from" collection (Motorbike)
          as: "motorbike_details", // Output array field name
        },
      },
      {
        $unwind: {
          path: "$motorbike_details",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Stage 4: Join with the 'users' collection to get owner details
      {
        $lookup: {
          from: "users", // The name of the users collection
          localField: "owner", // Field from the input documents (Vehicle)
          foreignField: "_id", // Field from the documents of the "from" collection (User)
          as: "owner_details", // Output array field name
        },
      },
      { $unwind: { path: "$owner_details", preserveNullAndEmptyArrays: true } }, // Assuming owner is always present due to required: true, but using preserveNullAndEmptyArrays is safer

      // Stage 5: Project the final output shape (include owner details)
      {
        $project: {
          _id: 1,
          owner: {
            // Project only necessary owner fields for admin view
            _id: "$owner_details._id",
            name: "$owner_details.name",
            email: "$owner_details.email",
            phone: "$owner_details.phone", // Include phone for admin
            // Add other owner fields useful for admin review (e.g., cccd_number if needed)
          },
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
          specificDetails: {
            // Create a new field to hold car or motorbike details
            $cond: {
              // Use $cond to conditionally include car or motorbike details
              if: { $eq: ["$type", "car"] },
              then: "$car_details",
              else: {
                // If not car, check if it's a motorbike
                $cond: {
                  if: { $eq: ["$type", "motorbike"] },
                  then: "$motorbike_details",
                  else: null,
                },
              },
            },
          },
        },
      },
      // You might add $sort, $skip, $limit stages here for pagination/sorting
      // { $sort: { createdAt: -1 } } // Example: sort by newest first
    ]);

    res
      .status(200)
      .json({ count: pendingVehicles.length, vehicles: pendingVehicles });
  } catch (error) {
    console.error("Error getting pending vehicle approvals for admin:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch pending vehicle approvals.",
        error: error.message,
      });
  }
};

// New function to get all approved vehicles
exports.getApprovedVehicles = async (req, res) => {
  try {
    // Find vehicles with approvalStatus set to 'approved'
    const approvedVehicles = await Vehicle.find({
      approvalStatus: "approved",
    }).populate("owner", "name email"); // Populate owner details if needed

    res
      .status(200)
      .json({ count: approvedVehicles.length, vehicles: approvedVehicles });
  } catch (error) {
    console.error("Error getting approved vehicles:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch approved vehicles.",
        error: error.message,
      });
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

// Add function to update a vehicle and associated data
exports.updateVehicle = async (req, res) => {
  console.log("Update Request Body:", req.body);
  const { id } = req.params;
  const {
    brand,
    model,
    licensePlate, // Corrected field name to match schema
    location,
    isAvailable, // Corrected field name to match schema
    pricePerDay, // Corrected field name to match schema
    deposit, // Corrected field name to match schema
    fuelConsumption, // Corrected field name to match schema
    features, // Corrected field name to match schema
    rentalPolicy, // Corrected field name to match schema
    type, // Make sure type is sent in the body for specific updates
    // Image updates (primaryImage, gallery) would need separate handling
    ...specificData // Data for Car or Motorbike
  } = req.body;

  try {
    // Find the vehicle to check its type before updating specific details
    const vehicleToUpdate = await Vehicle.findById(id);

    if (!vehicleToUpdate) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Prepare updates for the general Vehicle entry
    const vehicleUpdates = {
      brand,
      model,
      licensePlate,
      location,
      isAvailable,
      pricePerDay: parseFloat(pricePerDay), // Ensure price is a number
      deposit: parseFloat(deposit), // Ensure deposit is a number
      fuelConsumption: fuelConsumption
        ? parseFloat(fuelConsumption)
        : undefined, // Optional field
      features,
      rentalPolicy: Array.isArray(rentalPolicy)
        ? rentalPolicy.join("\n")
        : rentalPolicy, // Handle potential array/string input
      // Do not update type here as it defines the specific model
      // Image updates would go here if handled in this function
    };

    // Update the general Vehicle entry
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, vehicleUpdates, {
      new: true,
    });

    // Update associated specific details (Car or Motorbike) based on the vehicle's type
    if (vehicleToUpdate.type === "car" && type === "car") {
      // Ensure type in body matches existing type
      // Find the existing Car document by vehicle and update it
      const updatedCarDetails = await Car.findOneAndUpdate(
        { vehicle: id },
        {
          // Corrected foreignField to 'vehicle'
          seatCount: parseInt(specificData.seatCount, 10), // Corrected field name, ensure number
          bodyType: specificData.bodyType, // Corrected field name
          transmission: specificData.transmission
            ? specificData.transmission.toLowerCase()
            : undefined, // Corrected field name, ensure lowercase
          fuelType: specificData.fuelType
            ? specificData.fuelType.toLowerCase()
            : undefined, // Corrected field name, ensure lowercase
        },
        { new: true, upsert: true }
      ); // Use upsert: true in case specific details weren't created initially
    } else if (vehicleToUpdate.type === "motorbike" && type === "motorbike") {
      // Ensure type in body matches existing type
      // Find the existing Motorbike document by vehicle and update it
      const updatedMotorbikeDetails = await Motorbike.findOneAndUpdate(
        { vehicle: id },
        {
          // Corrected foreignField to 'vehicle'
          engineCapacity: specificData.engineCapacity
            ? parseFloat(specificData.engineCapacity)
            : undefined, // Corrected field name, ensure number
          hasGear: specificData.hasGear, // Corrected field name
        },
        { new: true, upsert: true }
      ); // Use upsert: true
    }
    // Note: If the vehicle type changes during an update, additional logic would be needed
    // to delete the old specific details and create new ones. This implementation assumes
    // the vehicle type remains constant during an update.

    res
      .status(200)
      .json({
        message: "Vehicle updated successfully!",
        vehicle: updatedVehicle,
      });
  } catch (error) {
    console.error("Error updating vehicle:", error);

    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.licensePlate
    ) {
      return res
        .status(400)
        .json({
          message: "License plate already exists.",
          field: "licensePlate",
        });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res
      .status(500)
      .json({ message: "Failed to update vehicle.", error: error.message });
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

// Add function to get a single vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    // Find vehicle by _id and populate related data using aggregation
    const vehicle = await Vehicle.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Match by Vehicle _id
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
          // Include all necessary fields, similar to getVehicles but for a single item
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
    ]);

    // Since aggregate returns an array, get the first element
    const vehicleData = vehicle.length > 0 ? vehicle[0] : null;

    if (!vehicleData) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    res.status(200).json({ vehicle: vehicleData });
  } catch (error) {
    console.error("Error getting vehicle by ID:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch vehicle details.",
        error: error.message,
      });
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

// lấy tất cả vehicles approved
