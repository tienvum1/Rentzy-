// be/controller/bookingController.js
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Car = require('../models/Car');

const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Tạo booking mới
// be/controller/bookingController.js
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
            
        } = req.body;
 console.log(req.body);
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
        const existingBookings = await Booking.find({
            vehicle: vehicleId,
            $or: [
                {
                    startDate: { $lte: endDateTime },
                    endDate: { $gte: startDateTime }
                }
            ]
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Xe đã được đặt trong khoảng thời gian này'
            });
        }

        // Create new booking
        const booking = new Booking({
            renter: req.user._id,
            vehicle: vehicleId,
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
            status: 'pending',
            promoCode,
            
            
        });

        await booking.save();

        // Create transaction record
        const transaction = new Transaction({
            booking: booking._id,
            payer: req.user._id,
            amount: totalAmount,
            status: 'pending',
            type: 'rental_fee',
            method: 'credit_card'
        });

        await transaction.save();

        // Update booking with transaction
        booking.transactions = [transaction._id];
        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Đặt xe thành công',
            data: {
                booking,
                transaction
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
// be/controller/bookingController.js
const getVehicleBookedDates = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const bookings = await Booking.find({
            vehicle: vehicleId,
            status: { $in: ['pending', 'paid', 'accepted', 'in_progress'] }
        }).select('startDate endDate pickupTime returnTime');

        const bookedDates = bookings.map(booking => {
            // Chuyển đổi thời gian từ UTC sang giờ Việt Nam
            const startDateTime = new Date(booking.startDate);
            const endDateTime = new Date(booking.endDate);

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
        const bookings = await Booking.find({ renter: userId })
            .populate('vehicle')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách booking',
            error: error.message
        });
    }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'renter',
        select: 'name  phone '
      })
      .populate({
        path: 'vehicle',
        select: ' model licensePlate primaryImage ',
        populate: {
          path: 'owner',
          select: 'name phone email'
        }
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

    // Format dates for response
    const formattedBooking = {
      ...booking.toObject(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    };

    res.json({
      success: true,
      booking: formattedBooking
    });

  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy thông tin đơn đặt xe" 
    });
  }
};

// Hủy booking
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        // Kiểm tra quyền hủy booking
        if (booking.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền hủy booking này'
            });
        }

        // Kiểm tra trạng thái booking có thể hủy không
        if (!['pending', 'paid'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy booking ở trạng thái này'
            });
        }

        // Cập nhật trạng thái booking
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = 'renter';
        booking.cancellationReason = req.body.reason || 'Người dùng hủy';

        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Hủy booking thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy booking',
            error: error.message
        });
    }
};

// Cập nhật trạng thái thanh toán
const updatePaymentStatus = async (req, res) => {
    try {
        const { bookingId, transactionId, status, paymentMethod } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        // Cập nhật trạng thái giao dịch
        transaction.status = status;
        transaction.method = paymentMethod;
        if (status === 'completed') {
            transaction.completedAt = new Date();
        }
        await transaction.save();

        // Cập nhật trạng thái booking
        if (status === 'completed') {
            booking.status = 'paid';
        } else if (status === 'failed') {
            booking.status = 'pending';
        }
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: {
                booking: {
                    _id: booking._id,
                    status: booking.status
                },
                transaction: {
                    _id: transaction._id,
                    status: transaction.status
                }
            }
        });

    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái thanh toán',
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
    updatePaymentStatus
};