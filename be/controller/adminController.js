const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

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

// Admin duyệt giải ngân cho chủ xe
const approvePayoutBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('bookingId' , bookingId)
    const adminId = req.user.id;
   
    // Tìm booking và populate vehicle
    let booking = await Booking.findById(bookingId).populate('vehicle');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    if (booking.payoutStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Đơn này chưa đến bước giải ngân hoặc đã giải ngân' });
    }
    if (!booking.vehicle) {
      console.log('booking.vehicle is undefined or null:', booking.vehicle);
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
    }
    if (!booking.vehicle.owner) {
      console.log('booking.vehicle.owner is undefined or null:', booking.vehicle.owner);
      return res.status(404).json({ success: false, message: 'Không tìm thấy chủ xe' });
    }
    const owner = await User.findById(booking.vehicle.owner);
    console.log('owner' , owner );
    console.log('owner:', owner);
    if (!owner || !owner._id) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chủ xe' });
    }

    // Tìm ví của owner
    const wallet = await Wallet.findOne({ user: owner._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ví chủ xe' });
    }
    

    // Kiểm tra số tiền tổng
    const totalAmount = typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Tổng tiền booking không hợp lệ' });
    }

    // Luôn tính lại adminFee và payoutAmount cho chắc chắn
    const adminFee = Math.round(totalAmount * 0.1);
    const payoutAmount = totalAmount - adminFee;

    // Cộng tiền vào ví
    wallet.balance += payoutAmount;
    await wallet.save();

    // Tạo transaction payout
    await Transaction.create({
      booking: booking._id,
      user: owner._id,
      amount: payoutAmount,
      type: 'PAYOUT',
      status: 'COMPLETED',
      paymentMethod: 'WALLET',
      description: 'Giải ngân cho chủ xe sau khi hoàn thành đơn thuê',
      approvedBy: adminId,
      approvedAt: new Date(),
      adminFee,
      totalAmount
    });

    // Cập nhật trạng thái payout và các trường liên quan
    booking.payoutStatus = 'approved';
    booking.payoutApprovedAt = new Date();
    booking.payoutApprovedBy = adminId;
    booking.adminFee = adminFee;
    booking.payoutAmount = payoutAmount;
    await booking.save();

    // Gửi notification cho owner
    await Notification.create({
      user: owner._id,
      type: 'payment',
      title: 'Đã nhận tiền giải ngân',
      message: `Bạn đã nhận được ${payoutAmount.toLocaleString('vi-VN')} VND từ đơn thuê xe #${booking._id.toString().slice(-6)}. Số tiền đã được cộng vào ví của bạn.`,
      booking: booking._id,
      data: { payoutAmount },
    });

    res.json({ success: true, payoutAmount, adminFee, totalAmount });
  } catch (err) {
    console.error('Approve payout error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt giải ngân', error: err.message });
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
    approvePayoutBooking,
};
