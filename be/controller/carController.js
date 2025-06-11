const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car'); // Import the Car model
const Motorbike = require('../models/Motorbike'); // Import the Motorbike model (useful if expanding to motorbikes later)
const mongoose = require('mongoose'); // Import mongoose

exports.getApprovedVehicles = async (req, res) => {
    try {
        // Find all cars and populate their associated vehicle data
        let approvedCars = await Car.find()
            .populate({
                path: 'vehicle',
                match: { approvalStatus: 'approved', status: 'available' },
                populate: {
                    path: 'owner',
                    select: 'name email' // Select specific owner fields
                }
            });

        // Filter out cars whose associated vehicle did not match the approvalStatus/status criteria
        approvedCars = approvedCars.filter(car => car.vehicle !== null);

        // Map the results to a format that matches the frontend's expectation for VehicleCard
        const vehiclesFormatted = approvedCars.map(car => ({
            _id: car._id,
            owner: car.vehicle.owner,
            brand: car.vehicle.brand,
            model: car.vehicle.model,
            type: car.vehicle.type,
            licensePlate: car.vehicle.licensePlate,
            location: car.vehicle.location,
            description: car.vehicle.description,
            pricePerDay: car.vehicle.pricePerDay,
            deposit: car.vehicle.deposit,
            features: car.vehicle.features,
            rentalPolicy: car.vehicle.rentalPolicy,
            primaryImage: car.vehicle.primaryImage,
            gallery: car.vehicle.gallery,
            approvalStatus: car.vehicle.approvalStatus,
            status: car.vehicle.status,
            createdAt: car.vehicle.createdAt,
            updatedAt: car.vehicle.updatedAt,
            // Include car-specific details directly
            seatCount: car.seatCount,
            bodyType: car.bodyType,
            transmission: car.transmission,
            fuelType: car.fuelType,
        }));

        res.status(200).json({ count: vehiclesFormatted.length, vehicles: vehiclesFormatted });

    } catch (error) {
        console.error('Error getting approved vehicles in carController:', error); // Added controller name to log
        res.status(500).json({ message: 'Failed to fetch approved vehicles.', error: error.message });
    }
};


// lấy theo id của car
exports.getCarById = async (req, res) => {
    try {
      const { id } = req.params; // ID của car
  
      // Tìm car và populate vehicle + owner
      const car = await Car.findById(id)
        .populate({
          path: 'vehicle',
          populate: {
            path: 'owner',
            select: '_id name email'
          }
        })
        .lean();
  
      if (!car || !car.vehicle) {
        return res.status(404).json({ message: 'Car or associated vehicle not found.' });
      }
  
      // Chuẩn hoá dữ liệu trả về FE
      const formatted = {
        _id: car._id,
        owner: car.vehicle.owner, // object: { _id, name, email }
        brand: car.vehicle.brand,
        model: car.vehicle.model,
        type: car.vehicle.type,
        licensePlate: car.vehicle.licensePlate,
        location: car.vehicle.location,
        description: car.vehicle.description,
        pricePerDay: car.vehicle.pricePerDay,
        deposit: car.vehicle.deposit,
        features: car.vehicle.features,
        rentalPolicy: car.vehicle.rentalPolicy,
        primaryImage: car.vehicle.primaryImage,
        gallery: car.vehicle.gallery,
        approvalStatus: car.vehicle.approvalStatus,
        status: car.vehicle.status,
        createdAt: car.vehicle.createdAt,
        updatedAt: car.vehicle.updatedAt,
        // car-specific fields
        seatCount: car.seatCount,
        bodyType: car.bodyType,
        transmission: car.transmission,
        fuelType: car.fuelType,
        engineCapacity: car.engineCapacity ?? null,
      };
  
      res.status(200).json({ vehicle: formatted });
  
    } catch (error) {
      console.error('Error in getCarById:', error);
      res.status(500).json({ message: 'Failed to fetch car details.', error: error.message });
    }
  };