// be/controller/vehicleController.js
// Remove Sequelize import
// const { Op } = require('sequelize');

// Import Mongoose Models
const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car');
const Motorbike = require('../models/Motorbike');
const VehicleImage = require('../models/VehicleImage');
// Assuming User model is already available/imported if needed elsewhere in this file
// const User = require('../models/User'); 

const path = require('path');
const fs = require('fs');

// Helper function to save images locally (This part is ORM-independent)
const saveImageLocally = async (imageFile) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'vehicles');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${imageFile.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, imageFile.buffer, (err) => {
            if (err) {
                return reject(err);
            }
            // Return the relative path or URL where the image can be accessed
            resolve(`/uploads/vehicles/${fileName}`);
        });
    });
};

// Add New Vehicle (General Handler)
exports.addVehicle = async (req, res) => {
    const { 
        brand, 
        model, 
        license_plate, 
        location, 
        is_available, // This comes as a string 'true' or 'false' from form-data
        price_per_day, 
        deposit_required, 
        terms, 
        type, // 'car' or 'motorbike'
        ...specificData // Specific fields for Car or Motorbike
    } = req.body;
    
    // Assuming user info is in req.user._id from Mongoose auth middleware
    const owner_id = req.user._id; 

    // Variable to hold the created vehicle document for potential rollback
    let createdVehicle = null;
    let createdSpecific = null;
    let createdImages = [];

    try {
        // 1. Create the general Vehicle entry using Mongoose
        // Mongoose create returns the document(s) created
        createdVehicle = await Vehicle.create({
            owner_id: owner_id, // Use the Mongoose user _id
            brand,
            model,
            type,
            license_plate,
            location,
            // Convert string boolean to actual boolean
            is_available: is_available === 'true',
            price_per_day: parseFloat(price_per_day), // Convert to Number
            deposit_required: deposit_required ? parseFloat(deposit_required) : undefined, // Convert and handle optional
            terms,
            created_at: new Date(), 
        });

        // 2. Create the specific vehicle type entry (Car or Motorbike) using Mongoose
        // Note: Car/Motorbike _id and vehicle_id should be the same as the Vehicle _id
        if (type === 'car') { // Use lowercase 'car' based on enum
            createdSpecific = await Car.create({
                _id: createdVehicle._id, // Use Vehicle's _id
                vehicle_id: createdVehicle._id, // Use Vehicle's _id for ref field
                seats: specificData.seats ? parseInt(specificData.seats, 10) : undefined, // Convert to Number
                body_type: specificData.body_type,
                transmission: specificData.transmission,
                fuel_type: specificData.fuel_type,
            });
        } else if (type === 'motorbike') { // Use lowercase 'motorbike' based on enum
             createdSpecific = await Motorbike.create({
                _id: createdVehicle._id, // Use Vehicle's _id
                vehicle_id: createdVehicle._id, // Use Vehicle's _id for ref field
                engine_capacity: specificData.engine_capacity ? parseInt(specificData.engine_capacity, 10) : undefined, // Convert to Number
                // Convert string boolean to actual boolean and handle optional
                has_gear: specificData.has_gear !== undefined ? specificData.has_gear === 'true' : undefined, 
            });
        } else {
            // If type is invalid, roll back the created Vehicle entry
            if (createdVehicle) {
                await Vehicle.deleteOne({ _id: createdVehicle._id });
            }
            return res.status(400).json({ message: 'Invalid vehicle type specified.' });
        }

        // 3. Handle image uploads (ORM-independent, but using Mongoose for saving image docs)
        const imageDocsToCreate = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const imageUrl = await saveImageLocally(file);
                    // Prepare image documents for Mongoose bulk insert
                    imageDocsToCreate.push({
                        _id: uuidv4(), // Generate new UUID for each image
                        vehicle_id: createdVehicle._id, // Link to the created Vehicle's _id
                        image_url: imageUrl,
                        is_primary: false, // Or determine primary based on upload order/flag
                    });
                } catch (imageError) {
                    console.error('Error saving image locally for file:', file.originalname, imageError);
                    // Decide how to handle image upload errors:
                    // - Log and continue (current approach - image won't be linked)
                    // - Rollback the entire vehicle creation (more complex, would need cleanup)
                }
            }

            // Bulk create image entries in the database using Mongoose
            if (imageDocsToCreate.length > 0) {
                createdImages = await VehicleImage.insertMany(imageDocsToCreate);
            }
        }

        // Success response
        res.status(201).json({
            message: 'Vehicle added successfully!',
            vehicleId: createdVehicle._id // Return the Mongoose _id (UUID)
        });

    } catch (error) {
        console.error('Error adding vehicle:', error);

        // Implement rollback logic in case of database errors after partial creation
        // This is a basic rollback; more robust transactions might be needed for complex flows.
        try {
            if (createdImages.length > 0) {
                // Delete images if they were created
                await VehicleImage.deleteMany({ _id: { $in: createdImages.map(img => img._id) } });
            }
            if (createdSpecific) {
                 // Delete specific type entry if created
                if (type === 'car') await Car.deleteOne({ _id: createdSpecific._id });
                if (type === 'motorbike') await Motorbike.deleteOne({ _id: createdSpecific._id });
            }
            if (createdVehicle) {
                // Delete the main vehicle entry if created
                await Vehicle.deleteOne({ _id: createdVehicle._id });
            }
            // Note: Local image files uploaded before the error would remain unless explicitly deleted
            // based on the imageUrls in imageDocsToCreate. This adds complexity.

        } catch (cleanupError) {
            console.error('Error during vehicle creation rollback:', cleanupError);
            // Log cleanup errors but proceed with sending the original error response
        }

        // Send error response
        res.status(500).json({ message: 'Failed to add vehicle.', error: error.message });
    }
};

// You would need to rewrite other controller functions (e.g., get vehicles, get single vehicle, update, delete) 
// to use Mongoose methods (find, findById, findOneAndUpdate, deleteOne, populate, aggregate, etc.)
// based on your specific needs for each route.
// Example for getting vehicles (basic):
/*
exports.getVehicles = async (req, res) => {
    try {
        // Basic find, populate owner, potentially filter/sort based on query params
        const vehicles = await Vehicle.find({}).populate('owner_id', 'name email avatar_url'); // Populate owner details
        // You might need to join with Car/Motorbike/VehicleImage using aggregation or separate queries

        res.status(200).json({ count: vehicles.length, vehicles });
    } catch (error) {
        console.error('Error getting vehicles:', error);
        res.status(500).json({ message: 'Failed to fetch vehicles.', error: error.message });
    }
};

exports.getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        // Find vehicle by _id (which is the UUID string)
        const vehicle = await Vehicle.findById(id)
                                 .populate('owner_id', 'name email avatar_url'); // Populate owner

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        // To get specific Car/Motorbike data and images, you'd typically query them separately
        const specificData = vehicle.type === 'car' 
                             ? await Car.findById(vehicle._id) 
                             : await Motorbike.findById(vehicle._id);
                             
        const images = await VehicleImage.find({ vehicle_id: vehicle._id });

        res.status(200).json({ vehicle: { ...vehicle.toObject(), specificData, images } });

    } catch (error) {
        console.error('Error getting vehicle by ID:', error);
        res.status(500).json({ message: 'Failed to fetch vehicle details.', error: error.message });
    }
};
*/ 