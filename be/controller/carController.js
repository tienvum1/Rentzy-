const Vehicle = require('../models/Vehicle');

exports.getApprovedVehicles = async (req, res) => {
    try {
        // Find vehicles with approvalStatus set to 'approved' and status set to 'available'
        const approvedVehicles = await Vehicle.find({ approvalStatus: 'approved', status: 'available' }).populate('owner', 'name email'); // Populate owner details if needed

        res.status(200).json({ count: approvedVehicles.length, vehicles: approvedVehicles });

    } catch (error) {
        console.error('Error getting approved vehicles in carController:', error); // Added controller name to log
        res.status(500).json({ message: 'Failed to fetch approved vehicles.', error: error.message });
    }
};
