// be/controller/bookingController.js
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// Tạo booking mới
const createBooking = async (req, res) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      pickupTime,
      returnTime,
      totalDays,
      totalAmount,
      totalCost,
      deposit,
      reservationFee,
      promoCode,
      discountAmount,
      deliveryFee

    } = req.body;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate || !pickupLocation || !returnLocation || !pickupTime || !returnTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin đặt xe'
      });
    }

    // Parse dates and times
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const [pickupHours, pickupMinutes] = pickupTime.split(':').map(Number);
    const [returnHours, returnMinutes] = returnTime.split(':').map(Number);

    // Create Date objects with local timezone
    const startDateTime = new Date(startYear, startMonth - 1, startDay, pickupHours, pickupMinutes);
    const endDateTime = new Date(endYear, endMonth - 1, endDay, returnHours, returnMinutes);

    // Validate dates
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      });
    }

    // Get current time in local timezone
    const now = new Date();

    // Check if start date is in the future
    if (startDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt xe trong quá khứ'
      });
    }

    // Check for existing bookings
    const car = await Car.findById(vehicleId);

    if (!car) {
      return res.status(404).json({ message: "Không tìm thấy xe." });
    }

    const realVehicleId = car.vehicle;

    // Kiểm tra các lịch thuê bị trùng
    const existingBookings = await Booking.find({
      vehicle: realVehicleId,
      status: { $in: ['pending', 'DEPOSIT_PAID', 'accepted', 'in_progress'] }, // Only check against active/pending bookings
      $or: [
        {
          startDate: { $lte: endDateTime },
          endDate: { $gte: startDateTime },
        }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(409).json({ message: "Xe đã được đặt trong thời gian này." });
    }

    // Create new booking
    const booking = new Booking({
      renter: req.user._id,
      vehicle: car.vehicle,
      startDate: startDateTime,
      endDate: endDateTime,
      pickupLocation,
      returnLocation,
      pickupTime,
      returnTime,
      totalDays,
      totalAmount,
      totalCost,
      deposit,
      reservationFee,
      discountAmount,
      status: 'pending', // Trạng thái ban đầu là pending
      promoCode,
      deliveryFee: deliveryFee || 0, // Thêm deliveryFee với giá trị mặc định là 0
    });

    await booking.save();

    // Initial transaction for holding fee (this is created when user initiates payment)
    // We don't create it here. It's handled in paymentController.js when MoMo payment is initiated.

    res.status(201).json({
      success: true,
      message: 'Đặt xe thành công',
      data: {
        booking,
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn đặt xe'
    });
  }
};

// Lấy lịch xe đã đặt
const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    console.log(vehicleId);
    const car = await Car.findById(vehicleId);
    console.log("id của vehicle", car.vehicle._id);
    const bookings = await Booking.find({
      vehicle: car.vehicle._id,
      status: { $in: ['pending', 'RENTAL_PAID', 'DEPOSIT_PAID', 'accepted', 'in_progress'] } // Chỉ lấy booking đang hoạt động
    }).select('startDate endDate pickupTime returnTime');

    const bookedDates = bookings.map(booking => {
      const startDateTime = new Date(booking.startDate);
      const endDateTime = new Date(booking.endDate);
      endDateTime.setHours(endDateTime.getHours() + 1);

      return {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        pickupTime: booking.pickupTime,
        returnTime: booking.returnTime
      };
    });

    res.status(200).json({
      success: true,
      bookedDates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch đặt xe',
      error: error.message
    });
  }
};

// Lấy danh sách booking của user
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // Optional filter by status

    const query = { renter: userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('vehicle', 'brand model primaryImage gallery pricePerDay owner')
      .populate('renter', 'fullName email phone')
      .populate({
        path: 'transactions',
        select: 'amount status type paymentMethod paymentMetadata createdAt'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Lấy chi tiết booking theo ID
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'renter',
        select: 'name phone'
      })
      .populate({
        path: 'vehicle',
        select: 'brand model licensePlate primaryImage pricePerDay owner deposit',
        populate: {
          path: 'owner',
          select: 'name phone email'
        }
      })
      .populate({
        path: 'transactions',
        select: 'amount type status paymentMethod paymentMetadata createdAt'
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt xe"
      });
    }

    // Check if user is authorized to view this booking
    if (booking.renter._id.toString() !== req.user._id.toString() &&
      !req.user.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem đơn đặt xe này"
      });
    }

    const car = await Car.findOne({ vehicle: booking.vehicle._id });

    // Format dates for response
    const formattedBooking = {
      ...booking.toObject(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    };

    res.status(200).json({
      success: true,
      booking: formattedBooking,
      carId: car ? car._id : null
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn đặt xe",
      error: error.message
    });
  }
};

// Hủy booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt xe.",
      });
    }

    // Only allow cancellation if booking is still pending or accepted
    if (booking.status !== "pending" && booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy đơn đặt xe đang chờ hoặc đã được chấp nhận.",
      });
    }

    // Check if the user is the renter or an admin/owner to cancel
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      !req.user.role.includes("admin") &&
      !req.user.role.includes("owner")
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn đặt xe này.",
      });
    }

    booking.status = "canceled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Đơn đặt xe đã được hủy thành công.",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đơn đặt xe",
      error: error.message,
    });
  }
};

// Hủy booking hết hạn (dùng nội bộ)
const cancelExpiredBooking = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log(`Booking ${bookingId} not found.`);
      return { success: false, message: "Booking not found." };
    }

    if (booking.status === 'pending') {
      const createdAt = new Date(booking.createdAt).getTime();
      const paymentTimeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds
      const expirationTime = createdAt + paymentTimeLimit;
      const now = Date.now();

      if (now > expirationTime) {
        booking.status = 'canceled';
        await booking.save();
        console.log(`Booking ${bookingId} has been canceled due to expiration.`);
        return { success: true, message: "Booking expired and canceled." };
      } else {
        return { success: false, message: "Booking is still within the time limit." };
      }
    } else {
      // If booking is not in pending status, it means it's already paid, accepted, or canceled by other means
      return { success: false, message: "Booking not in pending status." };
    }
  } catch (error) {
    console.error(`Error canceling expired booking ${bookingId}:`, error);
    return { success: false, message: error.message };
  }
};

// Cập nhật trạng thái thanh toán (dùng bởi webhook)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status; // Update booking status based on webhook
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking payment status updated',
      booking
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

const cancelBookingByFrontend = async (req, res) => {
  try {
    const { id } = req.params; // Lấy booking ID từ URL parameter
    const result = await cancelExpiredBooking(id);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      // Sử dụng các mã trạng thái HTTP phù hợp với thông báo lỗi
      if (result.message.includes("Booking not found")) {
        res.status(404).json({ success: false, message: result.message });
      } else if (result.message.includes("Booking not in pending status")) {
        res.status(400).json({ success: false, message: result.message });
      } else if (result.message.includes("Booking is still active")) {
        res.status(400).json({ success: false, message: result.message });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    }
  } catch (error) {
    console.error("Error in cancelBookingByFrontend:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi hủy booking." });
  }
};

// VAN KHAI : 
// get all booking of specific user : 
const getAllBookingOfSpecificUser = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      console.log('error in getAllBookingOfSpecificUser : dont have req.user._id ');
      return
    }
    const bookings = await Booking.find({ renter: userId })
      .populate({
        path: 'vehicle',
        select: 'model type licensePlate'
      })
      .select('startDate endDate totalAmount status deposit reservationFee pickupLocation returnLocation vehicle');

    const result = bookings.map(booking => ({
      vehicle: {
        model: booking.vehicle?.model,
        type: booking.vehicle?.type,
        licensePlate: booking.vehicle?.licensePlate
      },
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalAmount: booking.totalAmount,
      status: booking.status,
      deposit: booking.deposit,
      reservationFee: booking.reservationFee,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,

    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
}


// Hàm tính số tiền hoàn giữ chỗ (chỉ ngày thường)
function getReservationRefund(booking) {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  const reservationFee = booking.reservationFee || 0;
  
  console.log("=== REFUND CALCULATION DEBUG ===");
  console.log("startDate:", startDate);
  console.log("now:", now);
  console.log("tiền đã giữ chỗ:", reservationFee);
  console.log("diffDays:", diffDays);
  console.log("booking.status:", booking.status);

  let refundAmount = 0;
  if (diffDays > 10) {
    refundAmount = reservationFee; // 100%
    console.log("Hoàn 100% tiền cọc:", refundAmount);
  } else if (diffDays > 5) {
    refundAmount = reservationFee * 0.3; // 30%
    console.log("Hoàn 30% tiền cọc:", refundAmount);
  } else {
    refundAmount = 0; // 0%
    console.log("Không hoàn tiền cọc (dưới 5 ngày)");
  }
  
  console.log("=== END REFUND CALCULATION ===");
  return refundAmount;
}

// Hàm tính số tiền hoàn lại tổng cộng
function getTotalRefund(booking) {
  console.log("=== TOTAL REFUND CALCULATION ===");
  
  // Tính tổng số tiền đã thanh toán từ transactions COMPLETED
  const totalPaid = booking.transactions.reduce((sum, t) => {
    if (t.status === 'COMPLETED' && (t.type === 'DEPOSIT' || t.type === 'RENTAL')) {
      return sum + t.amount;
    }
    return sum;
  }, 0);
  
  console.log("Total paid from transactions:", totalPaid);
  console.log("Booking status:", booking.status);

  // Nếu đã thanh toán toàn bộ (CONFIRMED hoặc RENTAL_PAID): hoàn lại toàn bộ số tiền đã thanh toán
  if (booking.status === 'CONFIRMED' || booking.status === 'RENTAL_PAID') {
    // Tiền giữ chỗ hoàn theo chính sách
    const reservationRefund = getReservationRefund(booking);
    // Phần còn lại hoàn 100%
    const remainingRefund = totalPaid - (booking.reservationFee || 0);
    
    console.log("CONFIRMED/RENTAL_PAID - reservationRefund:", reservationRefund, "remainingRefund:", remainingRefund);
    
    return {
      reservationRefund,
      remainingRefund,
      totalRefund: reservationRefund + remainingRefund
    };
  }
  
  // Nếu chỉ thanh toán tiền cọc (DEPOSIT_PAID): chỉ hoàn reservationFee theo chính sách
  if (booking.status === 'DEPOSIT_PAID' || booking.status === 'deposit_paid') {
    const reservationRefund = getReservationRefund(booking);
    console.log("DEPOSIT_PAID - reservationRefund:", reservationRefund);
    
    return {
      reservationRefund,
      remainingRefund: 0,
      totalRefund: reservationRefund
    };  
  }
  
  // Nếu chưa thanh toán (pending): không hoàn
  if (booking.status === 'pending' || booking.status === 'PENDING') {
    console.log("PENDING - no refund");
    return {
      reservationRefund: 0,
      remainingRefund: 0,
      totalRefund: 0
    };
  }
  
  // Nếu trạng thái khác: không hoàn
  console.log("OTHER STATUS - no refund");
  return {
    reservationRefund: 0,
    remainingRefund: 0,
    totalRefund: 0
  };
}

// API: Hủy đơn và hoàn tiền giữ chỗ theo chính sách (chỉ ngày thường)
const cancelBookingWithRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Tìm booking và populate transactions
    const booking = await Booking.findById(id).populate('transactions');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn đặt xe.' 
      });
    }

    // Chỉ cho phép người thuê hoặc admin hủy
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      !req.user.role.includes('admin')
    ) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền hủy đơn này.' 
      });
    }

    // Kiểm tra trạng thái booking có thể hủy
    const allowedStatuses = ['pending', 'DEPOSIT_PAID', 'CONFIRMED', 'RENTAL_PAID'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể hủy đơn đặt xe ở trạng thái này.' 
      });
    }

    // Chỉ cho phép hủy nếu chưa bắt đầu chuyến đi
    const now = new Date();
    const startDate = new Date(booking.startDate);
    if (startDate <= now) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể hủy đơn đã bắt đầu.' 
      });
    }

    // Tính số tiền hoàn lại
    const { reservationRefund, remainingRefund, totalRefund } = getTotalRefund(booking);

    // Tìm ví của user
    const wallet = await Wallet.findOne({ user: booking.renter });
    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy ví của người dùng.' 
      });
    }

    try {
      // Cập nhật trạng thái booking
      booking.status = 'canceled';
      booking.cancellationReason = reason || 'User canceled';
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'renter';

      // Tạo transaction hoàn tiền giữ chỗ nếu có
      if (reservationRefund > 0) {
        const refundReservationTransaction = new Transaction({
          booking: booking._id,
          amount: reservationRefund,
          type: 'REFUND',
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          paymentMetadata: {
            reason: 'Refund reservation fee on cancel',
            originalBookingId: booking._id,
            cancellationReason: reason || 'User canceled',
            refundType: 'RESERVATION_FEE'
          }
        });
        await refundReservationTransaction.save();
        booking.transactions.push(refundReservationTransaction._id);
      }

      // Tạo transaction hoàn phần còn lại nếu có
      if (remainingRefund > 0) {
        const refundRemainingTransaction = new Transaction({
          booking: booking._id,
          amount: remainingRefund,
          type: 'REFUND',
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          paymentMetadata: {
            reason: 'Refund remaining payment on cancel',
            originalBookingId: booking._id,
            cancellationReason: reason || 'User canceled',
            refundType: 'REMAINING_PAYMENT'
          }
        });
        await refundRemainingTransaction.save();
        booking.transactions.push(refundRemainingTransaction._id);
      }

      // Lưu booking với transactions mới
      await booking.save();

      // Cộng tiền hoàn vào ví user
      if (totalRefund > 0) {
        wallet.balance += totalRefund;
        await wallet.save();
      }

      console.log(`Booking ${booking._id} canceled successfully. Refund: ${totalRefund} VND`);

      return res.status(200).json({
        success: true,
        message: `Đơn đã hủy thành công. Số tiền hoàn giữ chỗ: ${reservationRefund.toLocaleString('vi-VN')} VND, hoàn phần còn lại: ${remainingRefund.toLocaleString('vi-VN')} VND, tổng hoàn: ${totalRefund.toLocaleString('vi-VN')} VND`,
        data: {
          bookingId: booking._id,
          reservationRefund,
          remainingRefund,
          totalRefund,
          newWalletBalance: wallet.balance,
          cancellationReason: reason || 'User canceled',
          cancelledAt: booking.cancelledAt
        }
      });

    } catch (error) {
      console.error('Error during cancellation process:', error);
      throw error;
    }

  } catch (error) {
    console.error('Cancel booking with refund error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi hủy đơn và hoàn tiền.',
      error: error.message 
    });
  }
};

// API: Lấy thông tin hoàn tiền dự kiến khi hủy đơn
const getExpectedRefund = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm booking và populate transactions
    const booking = await Booking.findById(id).populate('transactions');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn đặt xe.' 
      });
    }

    // Chỉ cho phép người thuê hoặc admin xem
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      !req.user.role.includes('admin')
    ) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xem đơn này.' 
      });
    }

    // Kiểm tra có thể hủy không
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const canCancel = startDate > now;
    
    if (!canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn đã bắt đầu.',
        data: {
          canCancel: false,
          reason: 'Đơn đã bắt đầu'
        }
      });
    }

    // Tính số tiền hoàn lại dự kiến
    const { reservationRefund, remainingRefund, totalRefund } = getTotalRefund(booking);
    
    // Tính thời gian còn lại
    const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    // Tính tổng số tiền đã thanh toán
    const totalPaid = booking.transactions.reduce((sum, t) => {
      if (t.status === 'COMPLETED' && (t.type === 'DEPOSIT' || t.type === 'RENTAL')) {
        return sum + t.amount;
      }
      return sum;
    }, 0);

    return res.status(200).json({
      success: true,
      message: 'Thông tin hoàn tiền dự kiến',
      data: {
        bookingId: booking._id,
        bookingStatus: booking.status,
        canCancel: true,
        daysUntilStart,
        totalPaid,
        reservationFee: booking.reservationFee || 0,
        reservationRefund,
        remainingRefund,
        totalRefund,
        refundPolicy: {
          deposit_paid: {
            over_10_days: '100% tiền cọc',
            over_5_days: '30% tiền cọc',
            under_5_days: '0% tiền cọc'
          },
          confirmed: '100% số tiền đã thanh toán',
          pending: '0% (chưa thanh toán)'
        }
      }
    });

  } catch (error) {
    console.error('Get expected refund error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy thông tin hoàn tiền.',
      error: error.message 
    });
  }
};

// Get all bookings of a specific user with filters from client
const getFilteredBookingsOfUser = async (req, res) => {
  try {
    const userId =  req.user._id;
    console.log('userId in getFilteredBookingsOfUser', userId);
    // Check if userId is available
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract filters from query parameters
    const { model, type, status, startDate, endDate } = req.body;
    console.log('startDate', startDate);
    console.log('endDate', endDate);

    // Build booking query
    let bookingQuery = { renter: userId };
    if (status) bookingQuery.status = status;

    // Date range filter
    if (startDate && endDate) {
      bookingQuery.startDate = { $gte: new Date(startDate) };
      bookingQuery.endDate = { $lte: new Date(endDate) };
    }

    // Build vehicle filter for population
    let vehicleMatch = {};
    if (model) vehicleMatch.model = model;
    if (type) vehicleMatch.type = type;

    // Find bookings and populate vehicle with filter
    const bookings = await Booking.find(bookingQuery)
      .populate({
        path: 'vehicle',
        match: vehicleMatch,
        select: 'model type licensePlate'
      })
      .select('startDate endDate totalAmount status deposit reservationFee pickupLocation returnLocation vehicle');

    // Filter out bookings where vehicle doesn't match (populate returns null if not matched)
    const filtered = bookings.filter(b => b.vehicle);

    const result = filtered.map(booking => ({
      vehicle: {
        model: booking.vehicle.model,
        type: booking.vehicle.type,
        licensePlate: booking.vehicle.licensePlate
      },
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalAmount: booking.totalAmount,
      status: booking.status,
      deposit: booking.deposit,
      reservationFee: booking.reservationFee,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching filtered bookings:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// Lấy tất cả các model xe (dùng cho filter)
const getAllModelOfVehicle = async (req, res) => {
  try {
    // Lấy danh sách các model duy nhất từ collection Vehicle
    const models = await Vehicle.distinct('model');
    res.status(200).json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách model xe',
      error: error.message
    });
  }
};

// lấy tất cả status của booking của user : 
const getAllStatusOfBooking = async (req, res) => {
  try {
    const userId = '6840f01c4fb8acce3d4394c2'
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Lấy tất cả các status của booking của user
    const bookings = await Booking.find({ renter: userId }).select('status');
    const statuses = [...new Set(bookings.map(b => b.status))];

    res.status(200).json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Error fetching booking statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách trạng thái booking',
      error: error.message
    });
  }
};  

module.exports = {
  createBooking,
  getVehicleBookedDates,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  cancelExpiredBooking,
  updatePaymentStatus,
  cancelBookingByFrontend,
  getAllBookingOfSpecificUser
};