const { Op } = require('sequelize');
const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car');
const Motorbike = require('../models/Motorbike');
const VehicleImage = require('../models/VehicleImage');
const path = require('path');
const fs = require('fs');

// Helper function to save images locally
const saveImageLocally = async (imageFile) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'vehicles');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${imageFile.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    // Use a promise-based approach for writing file
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, imageFile.buffer, (err) => {
            if (err) {
                return reject(err);
            }
            // Return the relative path or URL where the image can be accessed
            // For local serving, this might be something like /uploads/vehicles/filename
            // In a real app, you'd configure static file serving or use a CDN URL
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
        is_available, 
        price_per_day, 
        deposit_required, 
        terms, 
        type, // 'car' or 'motorbike'
        ...specificData // Specific fields for Car or Motorbike
    } = req.body;
    
    const owner_id = req.user.user_id; // Assuming user info is in req.user from auth middleware

    try {
        // 1. Create the general Vehicle entry
        const vehicle = await Vehicle.create({
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
            created_at: new Date(), // Set created_at explicitly if timestamps are false
        });

        // 2. Create the specific vehicle type entry (Car or Motorbike)
        if (type === 'Car') {
            await Car.create({
                vehicle_id: vehicle.vehicle_id,
                seats: specificData.seats,
                body_type: specificData.body_type,
                transmission: specificData.transmission,
                fuel_type: specificData.fuel_type,
            });
        } else if (type === 'Motorbike') {
             await Motorbike.create({
                vehicle_id: vehicle.vehicle_id,
                engine_capacity: specificData.engine_capacity,
                has_gear: specificData.has_gear === 'true' || specificData.has_gear === true, // Handle boolean
            });
        } else {
            // If type is invalid, clean up the created Vehicle entry
            await vehicle.destroy();
            return res.status(400).json({ message: 'Invalid vehicle type specified.' });
        }

        // 3. Handle image uploads
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const imageUrl = await saveImageLocally(file);
                     uploadedImages.push({ vehicle_id: vehicle.vehicle_id, image_url: imageUrl });
                } catch (imageError) {
                    console.error('Error saving image locally:', imageError);
                    // Decide how to handle image upload errors:
                    // - Continue without the failed image
                    // - Rollback the entire vehicle creation (more complex)
                }
            }

            // Bulk create image entries in the database
            if (uploadedImages.length > 0) {
                await VehicleImage.bulkCreate(uploadedImages);
            }
        }

        res.status(201).json({ message: 'Vehicle added successfully!', vehicleId: vehicle.vehicle_id });

    } catch (error) {
        console.error('Error adding vehicle:', error);
        // Implement rollback logic if needed (e.g., if image upload failed after vehicle creation)
        res.status(500).json({ message: 'Failed to add vehicle.', error: error.message });
    }
}; 