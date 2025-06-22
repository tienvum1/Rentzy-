const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Lấy danh sách yêu cầu làm chủ xe
const getOwnerRequests = async (req, res) => {
    try {
        const pendingOwners = await User.find({ owner_request_status: 'pending' }).select('-password');
        res.status(200).json({ success: true, data: pendingOwners });
    } catch (error) {
        console.error("Error fetching owner requests:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

// Cập nhật trạng thái yêu cầu làm chủ xe
const updateOwnerRequestStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.owner_request_status = status;
        if (status === 'approved') {
            user.role = 'owner';
        }
        
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: `Yêu cầu của chủ xe đã được ${status === 'approved' ? 'chấp thuận' : 'từ chối'}.` });
    } catch (error) {
        console.error(`Error updating owner request status for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Lấy danh sách xe chờ duyệt
const getVehicleApprovalRequests = async (req, res) => {
    try {
        const pendingVehicles = await Vehicle.find({ status: 'pending' }).populate('owner_id', 'name email');
        res.status(200).json(pendingVehicles);
    } catch (error) {
        console.error("Error fetching vehicle approval requests:", error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Cập nhật trạng thái duyệt xe
const updateVehicleApprovalStatus = async (req, res) => {
    const { vehicleId } = req.params;
    const { status } = req.body; 

    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        vehicle.status = status;
        await vehicle.save();

        res.status(200).json({ message: `Vehicle ${status}` });
    } catch (error) {
        console.error(`Error updating vehicle status for vehicle ${vehicleId}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Lấy danh sách yêu cầu xác thực GPLX
const getDriverLicenseRequests = async (req, res) => {
    try {
        const pendingLicenses = await User.find({ 
            driver_license_verification_status: 'pending',
            driver_license_number: { $ne: null, $ne: '' } 
        }).select('-password');
        res.status(200).json(pendingLicenses);
    } catch (error) {
        console.error("Error fetching driver license requests:", error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Cập nhật trạng thái xác thực GPLX
const updateDriverLicenseStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; 

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        user.driver_license_verification_status = status;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ message: `Giấy phép lái xe đã được ${status === 'verified' ? 'chấp thuận' : 'từ chối'}.` });
    } catch (error) {
        console.error("Error updating driver license status:", error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Chỉ export một đối tượng duy nhất
module.exports = {
    getOwnerRequests,
    updateOwnerRequestStatus,
    getVehicleApprovalRequests,
    updateVehicleApprovalStatus,
    getDriverLicenseRequests,
    updateDriverLicenseStatus
};
