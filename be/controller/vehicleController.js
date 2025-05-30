const mongoose = require('mongoose');

const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car');
const Motorbike = require('../models/Motorbike');
const VehicleImage = require('../models/VehicleImage');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using the details from the image
cloudinary.config({
  cloud_name: 'dzoedops0',
  api_key: '983115579923496',
  api_secret: '7id18W5a26HNS-aKculDmkH1_vE'
});

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageFile) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'vehicles' }, // Optional: specify a folder in Cloudinary
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url); // Use secure_url for HTTPS
            }
        );
        uploadStream.end(imageFile.buffer);
    });
};

// Add New Vehicle (General Handler)
exports.addVehicle = async (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Request Files:', req.files);
    console.log('Request User:', req.user);

    const { 
        brand, 
        model, 
        license_plate, 
        location, 
        is_available, 
        price_per_day, 
        deposit_required, 
        terms, 
        type, // 'car' or 'motorbike'
        ...specificData // Specific fields for Car or Motorbike
    } = req.body;
    
    // Get owner_id from req.user._id (set by authMiddleware)
    const owner_id = req.user ? req.user._id : null;

    if (!owner_id) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    try {
        // 1. Create the general Vehicle entry
        const vehicle = new Vehicle({
            owner_id,
            brand,
            model,
            type,
            license_plate,
            location,
            is_available: is_available === 'true' || is_available === true, // Handle boolean from form data
            price_per_day,
            deposit_required,
            terms,
            created_at: new Date(),
        });

        await vehicle.save();

        // 2. Create the specific vehicle type entry (Car or Motorbike)
        // Note: The frontend sends type in lowercase, so we should match that here.
        if (type === 'car') {
            const car = new Car({
                vehicle_id: vehicle._id, // Use Mongoose _id
                seats: specificData.seats,
                body_type: specificData.body_type,
                transmission: specificData.transmission,
                fuel_type: specificData.fuel_type,
            });
             await car.save();
        } else if (type === 'motorbike') {
             const motorbike = new Motorbike({
                vehicle_id: vehicle._id, // Use Mongoose _id
                engine_capacity: specificData.engine_capacity,
                has_gear: specificData.has_gear === 'true' || specificData.has_gear === true, // Handle boolean
            });
             await motorbike.save();
        } else {
            throw new Error('Invalid vehicle type specified.');
        }

        // 3. Handle image uploads
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const imageUrl = await uploadImageToCloudinary(file);
                     uploadedImages.push({
                        vehicle_id: vehicle._id, // Use Mongoose _id
                        image_url: imageUrl,
                        is_primary: uploadedImages.length === 0 // Set the first image as primary
                     });
                } catch (imageError) {
                    console.error('Error uploading image to Cloudinary:', imageError);
                    // Decide how to handle image upload errors: Log and continue for now
                }
            }

            // Create image entries in the database
            if (uploadedImages.length > 0) {
                await VehicleImage.insertMany(uploadedImages);
            }
        }

        res.status(201).json({ message: 'Vehicle added successfully!', vehicleId: vehicle._id });

    } catch (error) {
        console.error('Error adding vehicle:', error);
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