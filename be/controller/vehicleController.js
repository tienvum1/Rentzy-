
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // 1. Create the general Vehicle entry
        const vehicle = new Vehicle({
            owner_id,

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

        await vehicle.save({ session });

        // 2. Create the specific vehicle type entry (Car or Motorbike)
        if (type === 'Car') {
            const car = new Car({
                vehicle_id: vehicle._id, // Use Mongoose _id
                seats: specificData.seats,

                body_type: specificData.body_type,
                transmission: specificData.transmission,
                fuel_type: specificData.fuel_type,
            });

             await car.save({ session });
        } else if (type === 'Motorbike') {
             const motorbike = new Motorbike({
                vehicle_id: vehicle._id, // Use Mongoose _id
                engine_capacity: specificData.engine_capacity,
                has_gear: specificData.has_gear === 'true' || specificData.has_gear === true, // Handle boolean

            });
             await motorbike.save({ session });
        } else {

            throw new Error('Invalid vehicle type specified.');

        }

        // 3. Handle image uploads (ORM-independent, but using Mongoose for saving image docs)
        const imageDocsToCreate = [];
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
                await VehicleImage.insertMany(uploadedImages, { session });
            }
        }

        await session.commitTransaction();
        res.status(201).json({ message: 'Vehicle added successfully!', vehicleId: vehicle._id });


    } catch (error) {
        await session.abortTransaction();
        console.error('Error adding vehicle:', error);

        res.status(500).json({ message: 'Failed to add vehicle.', error: error.message });
    } finally {
        session.endSession();
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