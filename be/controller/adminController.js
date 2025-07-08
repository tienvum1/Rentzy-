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

        res.status(200).json({
            success: true,
            message: `Yêu cầu của chủ xe đã được ${status === 'approved' ? 'chấp thuận' : 'từ chối'}.`
        });
    } catch (error) {
        console.error(`Error updating owner request status for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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

        res.status(200).json({
            message: `Giấy phép lái xe đã được ${status === 'verified' ? 'chấp thuận' : 'từ chối'}.`
        });
    } catch (error) {
        console.error("Error updating driver license status:", error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Lấy danh sách xe chờ duyệt
const getPendingVehicleApprovals = async (req, res) => {
    try {
        const pendingVehicles = await Vehicle.find({ approvalStatus: "pending" })
            .select('_id brand model licensePlate pricePerDay primaryImage approvalStatus status owner')
            .populate('owner', 'name email');
        res.status(200).json({ count: pendingVehicles.length, vehicles: pendingVehicles });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending vehicles.", error: error.message });
    }
};

// Lấy chi tiết xe chờ duyệt
const getPendingVehicleDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id).populate('owner', 'name email');
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found." });
        }
        res.status(200).json({ vehicle });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch vehicle detail.", error: error.message });
    }
};

// Duyệt hoặc từ chối xe mới
const reviewVehicleApproval = async (req, res) => {
    const { vehicleId } = req.params;
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }
        vehicle.approvalStatus = status;
        vehicle.rejectionReason = status === 'rejected' ? (rejectionReason || null) : null;
        await vehicle.save();
        res.status(200).json({ message: `Vehicle ${vehicleId} has been ${status}.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to review vehicle approval.', error: error.message });
    }
};

// Lấy danh sách xe có pending changes
const getVehiclesWithPendingChanges = async (req, res) => {
    try {
        const vehiclesWithPendingChanges = await Vehicle.find({ pendingChangeStatus: "pending" })
            .populate('owner', 'name email');
        res.status(200).json({ count: vehiclesWithPendingChanges.length, vehicles: vehiclesWithPendingChanges });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch vehicles with pending changes.', error: error.message });
    }
};

// Duyệt hoặc từ chối thay đổi xe
const reviewVehicleChanges = async (req, res) => {
    const { vehicleId } = req.params;
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }
        if (vehicle.pendingChangeStatus !== 'pending') {
            return res.status(400).json({ message: 'No pending changes to review.' });
        }
        if (status === 'approved') {
            // Áp dụng pendingChanges vào vehicle
            Object.assign(vehicle, vehicle.pendingChanges);
            vehicle.pendingChangeStatus = 'approved';
            vehicle.changeRejectionReason = null;
            vehicle.pendingChanges = undefined;
        } else {
            vehicle.pendingChangeStatus = 'rejected';
            vehicle.changeRejectionReason = rejectionReason || null;
            vehicle.pendingChanges = undefined;
        }
        await vehicle.save();
        res.status(200).json({ message: `Vehicle changes ${status}.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to review vehicle changes.', error: error.message });
    }
};

// ✅ Export tất cả ở một chỗ duy nhất
module.exports = {
    getOwnerRequests,
    updateOwnerRequestStatus,
    getDriverLicenseRequests,
    updateDriverLicenseStatus,
    getPendingVehicleApprovals,
    getPendingVehicleDetail,
    reviewVehicleApproval,
    getVehiclesWithPendingChanges,
    reviewVehicleChanges
};
