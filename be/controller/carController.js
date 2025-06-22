const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car'); // Import the Car model
const Motorbike = require('../models/Motorbike'); // Import the Motorbike model (useful if expanding to motorbikes later)
const mongoose = require('mongoose'); // Import mongoose

const Booking = require('../models/Booking');

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
      endDate
    } = req.body;

    console.log('Request body in getApprovedVehicles:', req.body);

    // Build vehicle filter
    let vehicleMatch = { approvalStatus: 'approved', status: 'available' };
    if (brand) vehicleMatch.brand = brand;
    if (model) vehicleMatch.model = model;
    if (location) vehicleMatch.location = location;
    if (fuelType) vehicleMatch.fuelType = fuelType;
    if (transmission) vehicleMatch.transmission = transmission;

    // Build car filter
    let carFilter = {};
    if (seatCount) carFilter.seatCount = seatCount;

    // Find all cars and populate their associated vehicle data
    let approvedCars = await Car.find(carFilter)
      .populate({
        path: 'vehicle',
        match: vehicleMatch,
        populate: {
          path: 'owner',
          select: 'name email'
        }
      });

    // Filter out cars whose associated vehicle did not match the approvalStatus/status criteria
    approvedCars = approvedCars.filter(car => car.vehicle !== null);

    // If startDate and endDate are provided, filter out cars that are booked in that range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all car.vehicle._id
      const vehicleIds = approvedCars.map(car => car.vehicle._id);

      // Find bookings that overlap with the requested date range
      const bookedVehicleIds = await Booking.find({
        vehicle: { $in: vehicleIds },
        $or: [
          {
            startDate: { $lte: end },
            endDate: { $gte: start }
          }
        ],
        status: { $nin: ['canceled', 'completed'] } // Only consider active bookings
      }).distinct('vehicle');

      // Filter out cars whose vehicle._id is in bookedVehicleIds
      approvedCars = approvedCars.filter(
        car => !bookedVehicleIds.includes(car.vehicle._id.toString())
      );
    }

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
      seatCount: car.seatCount,
      bodyType: car.bodyType,
      transmission: car.transmission,
      fuelType: car.fuelType,
    }));

    res.status(200).json({ count: vehiclesFormatted.length, vehicles: vehiclesFormatted });

  } catch (error) {
    console.error('Error getting approved vehicles in carController:', error);
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

// VAN KHAI : 
exports.getAllBrands = async (req, res) => {
  try {
    // Lấy tất cả các brand từ Vehicle có trạng thái available và approvalStatus: approved
    const brands = await Vehicle.find({
      status: 'available',
      approvalStatus: 'approved'
    }).distinct('brand');

    res.status(200).json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Failed to fetch brands.', error: error.message });
  }
}
exports.getAllModels = async (req, res) => {
  try {
    // Lấy tất cả các model từ Vehicle có trạng thái available và approvalStatus: approved
    const models = await Vehicle.find({
      status: 'available',
      approvalStatus: 'approved'
    }).distinct('model');

    res.status(200).json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Failed to fetch models.', error: error.message });
  }
}
exports.getAllLocations = async (req, res) => {
  try {
    // Lấy tất cả các location từ Vehicle có trạng thái available và approvalStatus: approved
    const locations = await Vehicle.find({
      status: 'available',
      approvalStatus: 'approved'
    }).distinct('location');

    res.status(200).json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations.', error: error.message });
  }
}
exports.getAllSeatCounts = async (req, res) => {
  try {
    // Lấy tất cả các seatCount từ Car có trạng thái available và approvalStatus: approved
    const seatCounts = await Car.find({
     
    }).distinct('seatCount');

    res.status(200).json({ seatCounts });
  } catch (error) {
    console.error('Error fetching seat counts:', error);
    res.status(500).json({ message: 'Failed to fetch seat counts.', error: error.message });
  }
} 
exports.getAllFuelTypes = async (req, res) => {
  try {
    // Lấy tất cả các fuelType từ Vehicle có trạng thái available và approvalStatus: approved
    const fuelTypes = await Car.find({
      
    }).distinct('fuelType');

    res.status(200).json({ fuelTypes });
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ message: 'Failed to fetch fuel types.', error: error.message });
  }
}
exports.getAllTransmission = async (req, res) => {
  try {
    // Lấy tất cả các transmission từ Vehicle có trạng thái available và approvalStatus: approved
    const transmissions = await Car.find({
    }).distinct('transmission');    
    res.status(200).json({ transmissions });
  } catch (error) {
    console.error('Error fetching transmissions:', error);
    res.status(500).json({ message: 'Failed to fetch transmissions.', error: error.message });
  }
}