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
        is_available, 
        price_per_day, 
        deposit_required, 
        terms, 
        type, // 'car' or 'motorbike'
        ...specificData // Specific fields for Car or Motorbike
    } = req.body;
    
    const owner_id = req.user.user_id; // Assuming user info is in req.user from auth middleware

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
            is_available: is_available === 'true' || is_available === true, // Handle boolean from form data
            price_per_day,
            deposit_required,
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