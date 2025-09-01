const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Hàm gọi FPT.AI OCR
async function extractDriverLicenseInfoFPT(imageUrl) {
  // Tải ảnh về file tạm nếu là URL
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const tempPath = `/tmp/license_${Date.now()}.jpg`;
  fs.writeFileSync(tempPath, response.data);
  const form = new FormData();
  form.append('image', fs.createReadStream(tempPath));
  const apiKey = process.env.FPT_AI_API_KEY ; // Đặt key thật ở .env
  try {
    const ocrRes = await axios.post(
      'https://api.fpt.ai/vision/dlr/vnm',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'api-key': apiKey,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    fs.unlinkSync(tempPath); // Xoá file tạm
    return ocrRes.data.data;
  } catch (error) {
    fs.unlinkSync(tempPath);
    throw error;
  }
}

// Controller nhận upload GPLX và xác thực AI
exports.createDriverLicense = async (req, res) => {
  try {
    const { driver_license_full_name, driver_license_birth_date, driver_license_number } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Upload ảnh lên cloudinary như cũ...
    let imageUrl = user.driver_license_image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'driver_licenses'
      });
      imageUrl = result.secure_url;
    }
    // Gọi FPT.AI OCR để trích xuất thông tin từ ảnh
    const ocrInfo = await extractDriverLicenseInfoFPT(imageUrl);
    // So sánh với thông tin user nhập
    if (
      ocrInfo.name.trim().toLowerCase() !== driver_license_full_name.trim().toLowerCase() ||
      ocrInfo.date_of_birth !== driver_license_birth_date ||
      ocrInfo.id !== driver_license_number
    ) {
      return res.status(400).json({ message: 'Thông tin trên ảnh GPLX không khớp với thông tin bạn nhập. Vui lòng kiểm tra lại!' });
    }
    // Nếu khớp, lưu thông tin và đặt trạng thái chờ duyệt
    user.driver_license_full_name = driver_license_full_name;
    user.driver_license_birth_date = driver_license_birth_date;
    user.driver_license_number = driver_license_number;
    user.driver_license_image = imageUrl;
    user.driver_license_verification_status = 'pending';
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ message: 'Thông tin GPLX đã được gửi để chờ admin duyệt!', user });
  } catch (error) {
    console.error("Error creating/updating driver license:", error);
    res.status(500).json({ message: 'Lỗi khi xử lý thông tin GPLX.' });
  }
};

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
const getPendingPayoutRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ payoutStatus: 'pending' })
      .populate('vehicle')
      .populate({ path: 'vehicle', populate: { path: 'owner' } })
      .populate('renter');
    const data = bookings.map(b => {
      const totalAmount = b.totalAmount || 0;
      let adminFee = b.adminFee;
      let payoutAmount = b.payoutAmount;
      if (!adminFee || !payoutAmount) {
        adminFee = Math.round(totalAmount * 0.1);
        payoutAmount = totalAmount - adminFee;
      }
      return {
        id: b._id,
        vehicle: b.vehicle,
        owner: b.vehicle?.owner,
        renter: b.renter,
        payoutAmount,
        adminFee,
        payoutStatus: b.payoutStatus,
        payoutNote: b.payoutNote,
        totalAmount,
        status: b.status,
        createdAt: b.createdAt
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Lấy danh sách booking chờ hoàn tiền cọc cho người thuê
const getPendingDepositRefundRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ depositRefundStatus: 'pending' })
      .populate('vehicle')
      .populate({ path: 'vehicle', populate: { path: 'owner' } })
      .populate('renter');
    const data = bookings.map(b => {
      const totalAmount = b.totalAmount || 0;
      return {
        id: b._id,
        vehicle: b.vehicle,
        owner: b.vehicle?.owner,
        renter: b.renter,
        deposit: b.deposit,
        depositRefundStatus: b.depositRefundStatus,
        totalAmount,
        status: b.status,
        createdAt: b.createdAt
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Admin duyệt hoàn tiền cọc cho người thuê
const approveDepositRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.user.id;
    let booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    if (booking.depositRefundStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Tiền cọc đã được hoàn trước đó.' });
    }
    if (!booking.deposit || booking.deposit <= 0) {
      return res.status(400).json({ success: false, message: 'Đơn này không có tiền cọc.' });
    }
    // Check if a REFUND transaction for deposit already exists
    const existingRefund = await Transaction.findOne({
      booking: booking._id,
      type: 'REFUND',
      status: 'COMPLETED',
      paymentMethod: 'WALLET',
      'paymentMetadata.refundType': 'DEPOSIT',
    });
    if (existingRefund) {
      booking.depositRefundStatus = 'approved';
      await booking.save();
      return res.status(400).json({ success: false, message: 'Tiền cọc đã được hoàn trước đó.' });
    }
    // Find renter's wallet
    const renterWallet = await Wallet.findOne({ user: booking.renter });
    if (!renterWallet) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ví người thuê.' });
    }
    renterWallet.balance += booking.deposit;
    await renterWallet.save();
    // Create refund transaction
    await Transaction.create({
      booking: booking._id,
      user: booking.renter,
      amount: booking.deposit,
      type: 'REFUND',
      status: 'COMPLETED',
      paymentMethod: 'WALLET',
      paymentMetadata: {
        originalBookingId: booking._id,
        refundType: 'DEPOSIT',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      description: 'Hoàn lại tiền đặt cọc cho người thuê khi hoàn thành đơn',
    });
    // Notify renter
    await Notification.create({
      user: booking.renter,
      type: 'payment',
      title: 'Hoàn tiền đặt cọc',
      message: `Bạn đã được hoàn lại ${booking.deposit.toLocaleString('vi-VN')} VND tiền đặt cọc từ đơn thuê xe #${booking._id.toString().slice(-6)}. Số tiền đã được cộng vào ví của bạn.`,
      booking: booking._id,
      data: { depositRefund: booking.deposit },
    });
    booking.depositRefundStatus = 'approved';
    await booking.save();
    res.json({ success: true, depositRefund: booking.deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server khi hoàn tiền cọc', error: err.message });
  }
};

// Admin duyệt giải ngân cho chủ xe (chỉ tiền thuê)
const approvePayoutBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.user.id;
    let booking = await Booking.findById(bookingId).populate('vehicle');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    if (booking.payoutStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Đơn này đã được giải ngân trước đó.' });
    }
    if (!booking.vehicle) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
    }
    if (!booking.vehicle.owner) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chủ xe' });
    }
    const owner = await User.findById(booking.vehicle.owner);
    if (!owner || !owner._id) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chủ xe' });
    }
    const wallet = await Wallet.findOne({ user: owner._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ví chủ xe' });
    }
    // Tính số tiền thực nhận (chỉ tiền thuê, không tính cọc)
    const deposit = booking.deposit || 0;
    const totalAmount = typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Tổng tiền booking không hợp lệ' });
    }
    const adminFee = Math.round((totalAmount - deposit) * 0.1);
    const payoutAmount = (totalAmount - deposit) - adminFee;
    wallet.balance += payoutAmount;
    await wallet.save();
    await Transaction.create({
      booking: booking._id,
      user: owner._id,
      amount: payoutAmount,
      type: 'PAYOUT',
      status: 'COMPLETED',
      paymentMethod: 'WALLET',
      description: 'Giải ngân cho chủ xe sau khi hoàn thành đơn thuê (không bao gồm tiền cọc)',
      approvedBy: adminId,
      approvedAt: new Date(),
      adminFee,
      totalAmount: totalAmount - deposit
    });
    booking.payoutStatus = 'approved';
    booking.payoutApprovedAt = new Date();
    booking.payoutApprovedBy = adminId;
    booking.adminFee = adminFee;
    booking.payoutAmount = payoutAmount;
    await booking.save();
    await Notification.create({
      user: owner._id,
      type: 'payment',
      title: 'Đã nhận tiền giải ngân',
      message: `Bạn đã nhận được ${payoutAmount.toLocaleString('vi-VN')} VND từ đơn thuê xe #${booking._id.toString().slice(-6)} (không bao gồm tiền cọc). Số tiền đã được cộng vào ví của bạn.`,
      booking: booking._id,
      data: { payoutAmount },
    });
    res.json({ success: true, payoutAmount, adminFee, totalAmount: totalAmount - deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt giải ngân', error: err.message });
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
    getDashboardStats,
    getPendingPayoutRequests,
    getPendingDepositRefundRequests,
    approveDepositRefund,
    approvePayoutBooking,
    createDriverLicense: exports.createDriverLicense, // Add the new function to exports
};
