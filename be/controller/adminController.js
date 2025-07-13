const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

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

        // --- Notification logic ---
        let notifyTitle = 'Kết quả yêu cầu đăng ký chủ xe';
        let notifyMessage = '';
        if (status === 'approved') {
          notifyMessage = 'Yêu cầu đăng ký chủ xe của bạn đã được duyệt. Bạn đã trở thành chủ xe.';
        } else {
          notifyMessage = 'Yêu cầu đăng ký chủ xe của bạn đã bị từ chối.';
        }
        await Notification.create({
          user: user._id,
          type: 'system',
          title: notifyTitle,
          message: notifyMessage,
          data: { owner_request_status: status },
        });

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

        // --- Notification logic ---
        let notifyTitle = 'Kết quả xác thực giấy phép lái xe';
        let notifyMessage = '';
        if (status === 'verified') {
          notifyMessage = 'Giấy phép lái xe của bạn đã được xác thực thành công.';
        } else {
          notifyMessage = 'Giấy phép lái xe của bạn đã bị từ chối xác thực.';
        }
        await Notification.create({
          user: user._id,
          type: 'system',
          title: notifyTitle,
          message: notifyMessage,
          data: { driver_license_verification_status: status },
        });

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

    // Gửi notification cho owner về kết quả duyệt
    let notifyTitle = 'Kết quả duyệt xe';
    let notifyMessage = '';
    if (status === 'approved') {
      notifyMessage = `Xe ${vehicle.brand} ${vehicle.model} của bạn đã được duyệt và sẵn sàng cho thuê.`;
    } else {
      notifyMessage = `Xe ${vehicle.brand} ${vehicle.model} của bạn đã bị từ chối duyệt.${rejectionReason ? ' Lý do: ' + rejectionReason : ''}`;
    }
    await require('../models/Notification').create({
      user: vehicle.owner,
      type: 'vehicle',
      title: notifyTitle,
      message: notifyMessage,
      vehicle: vehicle._id,
      data: { approvalStatus: status, rejectionReason: status === 'rejected' ? rejectionReason : undefined },
    });

    res.status(200).json({ message: `Vehicle ${vehicleId} has been ${status}.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review vehicle approval.', error: error.message });
  }
};


// Lấy danh sách booking chờ duyệt giải ngân cho chủ xe
const getPayoutRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ payoutStatus: 'pending' })
      .populate('vehicle')
      .populate({ path: 'vehicle', populate: { path: 'owner' } });
    const data = bookings.map(b => ({
      id: b._id,
      vehicle: b.vehicle,
      owner: b.vehicle?.owner,
      payoutAmount: b.payoutAmount,
      payoutStatus: b.payoutStatus,
      payoutNote: b.payoutNote,
      totalCost: b.totalCost,
      status: b.status,
      createdAt: b.createdAt
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Admin duyệt chuyển tiền cho chủ xe
const approvePayout = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('vehicle');
    if (!booking || booking.payoutStatus !== 'pending') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking chờ duyệt' });
    }
    const ownerId = booking.vehicle.owner;
    const wallet = await Wallet.findOne({ user: ownerId });
    if (!wallet) return res.status(404).json({ success: false, message: 'Không tìm thấy ví chủ xe' });
    wallet.balance += booking.payoutAmount;
    await wallet.save();
    booking.payoutStatus = 'approved';
    await booking.save();
    await Transaction.create({
      booking: booking._id,
      user: ownerId,
      amount: booking.payoutAmount,
      type: 'PAYOUT',
      status: 'COMPLETED',
      paymentMethod: 'WALLET',
      description: 'Giải ngân cho chủ xe sau khi hoàn thành đơn thuê'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: { $in: ['admin'] } });
        const totalOwners = await User.countDocuments({ role: { $in: ['owner'] } });
        const totalRenters = await User.countDocuments({ role: { $in: ['renter'] } });

        const totalVehicles = await Vehicle.countDocuments();
        const pendingVehicles = await Vehicle.countDocuments({ approvalStatus: 'pending' });
        const approvedVehicles = await Vehicle.countDocuments({ approvalStatus: 'approved' });
        const availableVehicles = await Vehicle.countDocuments({ status: 'available' });

        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const completedBookings = await Booking.countDocuments({ status: 'completed' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

        const totalTransactions = await Transaction.countDocuments();
        const completedTransactions = await Transaction.countDocuments({ status: 'COMPLETED' });

        const revenueStats = await Transaction.aggregate([
            { $match: { status: 'COMPLETED', type: { $in: ['RENTAL', 'DEPOSIT'] } } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

        const pendingOwnerRequests = await User.countDocuments({ owner_request_status: 'pending' });
        const pendingDriverLicenses = await User.countDocuments({ 
            driver_license_verification_status: 'pending',
            driver_license_number: { $ne: null, $ne: '' } 
        });
        const pendingPayouts = await Booking.countDocuments({ payoutStatus: 'pending' });

        const monthlyStats = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalCost' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const topVehicles = await Vehicle.aggregate([
            { $sort: { rentalCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            { $unwind: '$owner' },
            {
                $project: {
                    _id: 1,
                    brand: 1,
                    model: 1,
                    licensePlate: 1,
                    rentalCount: 1,
                    pricePerDay: 1,
                    primaryImage: 1,
                    'owner.name': 1
                }
            }
        ]);

        const topOwners = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicle',
                    foreignField: '_id',
                    as: 'vehicle'
                }
            },
            { $unwind: '$vehicle' },
            {
                $group: {
                    _id: '$vehicle.owner',
                    totalRevenue: { $sum: '$payoutAmount' },
                    bookingCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            { $unwind: '$owner' },
            {
                $project: {
                    _id: 1,
                    'owner.name': 1,
                    'owner.email': 1,
                    totalRevenue: 1,
                    bookingCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                userStats: {
                    total: totalUsers,
                    admins: totalAdmins,
                    owners: totalOwners,
                    renters: totalRenters
                },
                vehicleStats: {
                    total: totalVehicles,
                    pending: pendingVehicles,
                    approved: approvedVehicles,
                    available: availableVehicles
                },
                bookingStats: {
                    total: totalBookings,
                    pending: pendingBookings,
                    completed: completedBookings,
                    cancelled: cancelledBookings
                },
                transactionStats: {
                    total: totalTransactions,
                    completed: completedTransactions,
                    totalRevenue: totalRevenue
                },
                pendingRequests: {
                    ownerRequests: pendingOwnerRequests,
                    driverLicenses: pendingDriverLicenses,
                    payouts: pendingPayouts
                },
                monthlyStats,
                topVehicles,
                topOwners
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
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
    getPayoutRequests,
    approvePayout,
    getDashboardStats
};
