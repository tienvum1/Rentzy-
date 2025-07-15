// be/controller/bookingController.js
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
// const Car = require("../models/Car");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");
const cloudinary = require('../utils/cloudinary');
const mongoose = require('mongoose'); // Đảm bảo đã import mongoose

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
      promoCode,
      discountAmount,
      deliveryFee,
    } = req.body;
    
    // Validate required fields
    if (
      !vehicleId ||
      !startDate ||
      !endDate ||
      !pickupLocation ||
      !returnLocation ||
      !pickupTime ||
      !returnTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin đặt xe",
      });
    }

    // Parse dates and times
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
    const [pickupHours, pickupMinutes] = pickupTime.split(":").map(Number);
    const [returnHours, returnMinutes] = returnTime.split(":").map(Number);

    // Create Date objects with local timezone
    const startDateTime = new Date(
      startYear,
      startMonth - 1,
      startDay,
      pickupHours,
      pickupMinutes
    );
    const endDateTime = new Date(
      endYear,
      endMonth - 1,
      endDay,
      returnHours,
      returnMinutes
    );

    // Validate dates
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    // Get current time in local timezone
    const now = new Date();

    // Check if start date is in the future
    if (startDateTime < now) {
      return res.status(400).json({
        success: false,
        message: "Không thể đặt xe trong quá khứ",
      });
    }

    // Check for existing bookings
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe." });
    }

    const realVehicleId = vehicle._id;

    // Kiểm tra các lịch thuê bị trùng
    const existingBookings = await Booking.find({
      vehicle: realVehicleId,
      status: { $in: ["pending", "DEPOSIT_PAID", "accepted", "in_progress"] }, // Only check against active/pending bookings
      $or: [
        {
          startDate: { $lte: endDateTime },
          endDate: { $gte: startDateTime },
        },
      ],
    });

    if (existingBookings.length > 0) {
      return res
        .status(409)
        .json({ message: "Xe đã được đặt trong thời gian này." });
    }

    // Calculate/validate all price fields
    // totalCost: phí thuê xe
    // deliveryFee: phí giao xe (2 chiều)
    // deposit: tiền đặt cọc
    // discountAmount: giảm giá
    // totalAmount: tổng cộng (không còn reservationFee)
    let _totalCost = typeof totalCost === 'number' ? totalCost : 0;
    let _deliveryFee = typeof deliveryFee === 'number' ? deliveryFee : 0;
    let _deposit = typeof deposit === 'number' ? deposit : 0;
    let _discountAmount = typeof discountAmount === 'number' ? discountAmount : 0;
    // Tổng cộng là tổng tất cả tiền (không có reservationFee):
    let _totalAmount = _totalCost + _deliveryFee + _deposit - _discountAmount;

    // Ensure all values are >= 0
    _totalCost = Math.max(0, _totalCost);
    _deliveryFee = Math.max(0, _deliveryFee);
    _deposit = Math.max(0, _deposit);
    _discountAmount = Math.max(0, _discountAmount);
    _totalAmount = Math.max(0, _totalAmount);

    // Create new booking with explicit mapping (KHÔNG LƯU reservationFee)
    const booking = new Booking({
      renter: req.user._id,
      vehicle: vehicle._id,
      startDate: startDateTime,
      endDate: endDateTime,
      pickupLocation,
      returnLocation,
      pickupTime,
      returnTime,
      totalDays,
      totalCost: _totalCost, // Phí thuê xe
      deliveryFee: _deliveryFee, // Phí giao xe (2 chiều)
      deposit: _deposit, // Tiền đặt cọc
      discountAmount: _discountAmount, // Giảm giá
      totalAmount: _totalAmount, // Tổng cộng
      status: "pending", // Trạng thái ban đầu là pending
      promoCode,
    });

    await booking.save();

    // --- NOTIFICATION LOGIC ---
    // 1. Notify renter (người thuê)
    await Notification.create({
      user: req.user._id,
      type: 'booking',
      title: 'Đặt xe thành công',
      message: `Bạn đã đặt xe ${vehicle.brand} ${vehicle.model} thành công. Vui lòng thanh toán để xác nhận đơn!`,
      booking: booking._id,
      vehicle: vehicle._id,
    });

    // 2. Notify owner (chủ xe)
    if (vehicle.owner) {
      await Notification.create({
        user: vehicle.owner,
        type: 'booking',
        title: 'Có đơn đặt xe mới',
        message: `Xe ${vehicle.brand} ${vehicle.model} của bạn vừa có đơn đặt mới từ khách hàng.`,
        booking: booking._id,
        vehicle: vehicle._id,
      });
    }

    // 3. Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'admin',
        title: 'Đơn đặt xe mới',
        message: `Có đơn đặt xe mới cho xe ${vehicle.brand} ${vehicle.model} từ người dùng ${req.user.name || req.user.email}.`,
        booking: booking._id,
        vehicle: vehicle._id,
      });
    }
    // --- END NOTIFICATION LOGIC ---

    // Initial transaction for holding fee (this is created when user initiates payment)
    // We don't create it here. It's handled in paymentController.js when MoMo payment is initiated.

    res.status(201).json({
      success: true,
      message: "Đặt xe thành công",
      data: {
        booking,
        priceBreakdown: {
          totalCost: _totalCost,
          deliveryFee: _deliveryFee,
          deposit: _deposit,
          discountAmount: _discountAmount,
          totalAmount: _totalAmount,
        }
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đơn đặt xe",
    });
  }
};

// Lấy lịch xe đã đặt
const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    }
    const bookings = await Booking.find({
      vehicle: vehicle._id,
      status: {
        $in: [
          'pending',
          'deposit_paid',
          'in_progress',
          'fully_paid',
          'cancel_requested'
        ],
      },
    }).select('startDate endDate pickupTime returnTime');

    const bookedDates = bookings.map((booking) => {
      const startDateTime = new Date(booking.startDate);
      const endDateTime = new Date(booking.endDate);
      endDateTime.setHours(endDateTime.getHours() + 1);
      return {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        pickupTime: booking.pickupTime,
        returnTime: booking.returnTime,
      };
    });

    res.status(200).json({
      success: true,
      bookedDates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch đặt xe',
      error: error.message,
    });
  }
};

// Lấy danh sách booking của user
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let status = req.query.status; // Optional filter by status

    const query = { renter: userId };
    if (status) {
      // Normalize status to lowercase for consistent filtering
      status = status.toLowerCase();
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("vehicle", "brand model primaryImage gallery pricePerDay owner")
      .populate("renter", "fullName email phone")
      .populate({
        path: "transactions",
        select: "amount status type paymentMethod paymentMetadata createdAt",
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
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Lấy chi tiết booking theo ID
const getBookingDetails = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "renter",
        select: "name phone",
      })
      .populate({
        path: "vehicle",
        select:
          "brand model licensePlate primaryImage pricePerDay owner deposit",
        populate: {
          path: "owner",
          select: "name phone email",
        },
      })
      .populate({
        path: "transactions",
        select: "amount type status paymentMethod paymentMetadata createdAt",
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt xe",
      });
    }

    // Check if user is authorized to view this booking
    if (
      booking.renter._id.toString() !== req.user._id.toString() &&
      !req.user.role.includes("admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem đơn đặt xe này",
      });
    }

    const vehicle = await Vehicle.findOne({ vehicle: booking.vehicle._id });

    // Format dates for response
    const formattedBooking = {
      ...booking.toObject(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };

    res.status(200).json({
      success: true,
      booking: formattedBooking,
      carId: vehicle ? vehicle._id : null,
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn đặt xe",
      error: error.message,
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

    if (booking.status === "pending") {
      const createdAt = new Date(booking.createdAt).getTime();
      const paymentTimeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds
      const expirationTime = createdAt + paymentTimeLimit;
      const now = Date.now();

      if (now > expirationTime) {
        booking.status = "canceled";
        await booking.save();
        console.log(
          `Booking ${bookingId} has been canceled due to expiration.`
        );
        return { success: true, message: "Booking expired and canceled." };
      } else {
        return {
          success: false,
          message: "Booking is still within the time limit.",
        };
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
        message: "Booking not found",
      });
    }

    booking.status = status; // Update booking status based on webhook
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking payment status updated",
      booking,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
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
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi hủy booking." });
  }
};

// VAN KHAI :
// get all booking of specific user :
const getAllBookingOfSpecificUser = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      console.log(
        "error in getAllBookingOfSpecificUser : dont have req.user._id "
      );
      return;
    }
    const bookings = await Booking.find({ renter: userId })
      .populate({
        path: "vehicle",
        select: "model type licensePlate",
      })
      .select(
        "startDate endDate totalAmount status deposit reservationFee pickupLocation returnLocation vehicle"
      );

    const result = bookings.map((booking) => ({
      vehicle: {
        model: booking.vehicle?.model,
        type: booking.vehicle?.type,
        licensePlate: booking.vehicle?.licensePlate,
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
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};



// Get all bookings of a specific user with filters from client
const getFilteredBookingsOfUser = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("userId in getFilteredBookingsOfUser", userId);
    // Check if userId is available
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract filters from query parameters
    const { model, type, status, startDate, endDate } = req.body;
    console.log("startDate", startDate);
    console.log("endDate", endDate);

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
        path: "vehicle",
        match: vehicleMatch,
        select: "model type licensePlate",
      })
      .select(
        "startDate endDate totalAmount status deposit reservationFee pickupLocation returnLocation vehicle"
      );

    // Filter out bookings where vehicle doesn't match (populate returns null if not matched)
    const filtered = bookings.filter((b) => b.vehicle);

    const result = filtered.map((booking) => ({
      vehicle: {
        model: booking.vehicle.model,
        type: booking.vehicle.type,
        licensePlate: booking.vehicle.licensePlate,
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
    console.error("Error fetching filtered bookings:", error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Lấy tất cả các model xe (dùng cho filter)
const getAllModelOfVehicle = async (req, res) => {
  try {
    // Lấy danh sách các model duy nhất từ collection Vehicle
    const models = await Vehicle.distinct("model");
    res.status(200).json({
      success: true,
      models,
    });
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách model xe",
      error: error.message,
    });
  }
};

// lấy tất cả status của booking của user :
const getAllStatusOfBooking = async (req, res) => {
  try {
    const userId = "6840f01c4fb8acce3d4394c2";
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Lấy tất cả các status của booking của user
    const bookings = await Booking.find({ renter: userId }).select("status");
    const statuses = [...new Set(bookings.map((b) => b.status))];

    res.status(200).json({
      success: true,
      statuses,
    });
  } catch (error) {
    console.error("Error fetching booking statuses:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách trạng thái booking",
      error: error.message,
    });
  }
};

// API: Huỷ booking (chỉ cho phép khi status là 'pending' hoặc 'deposit_paid')
const cancelBookingByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    if (!['pending', 'deposit_paid'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể huỷ đơn khi chưa hoặc mới thanh toán cọc.' });
    }
    booking.status = 'canceled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'User canceled';
    booking.cancelledBy = 'renter';
    await booking.save();
    return res.json({ success: true, message: 'Huỷ đơn thành công.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server khi huỷ đơn.' });
  }
};




// Owner approves cancellation
const ownerApproveCancel = async (req, res) => {
  try {
    const { id } = req.params;
    let { totalRefund } = req.body;
    const booking = await Booking.findById(id).populate('vehicle').populate('renter').populate('transactions');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    if (!booking.vehicle || booking.vehicle.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Bạn không có quyền duyệt huỷ đơn này.' });
    if (booking.status !== 'cancel_requested')
      return res.status(400).json({ success: false, message: 'Đơn không ở trạng thái chờ huỷ.' });

    // Ưu tiên lấy số tiền hoàn đã lưu trong booking (nếu có)
    if (typeof booking.totalRefund === 'number' && booking.totalRefund > 0) totalRefund = booking.totalRefund;

    // Nếu vẫn chưa có, fallback về logic cũ
    if (typeof totalRefund !== 'number' || totalRefund <= 0) {
      // fallback: tự tính lại như cũ (chỉ hoàn cọc)
      totalRefund = getDepositRefund(booking);
    }

    const wallet = await Wallet.findOne({ user: booking.renter._id });
    if (!wallet) return res.status(404).json({ success: false, message: 'Không tìm thấy ví của người thuê.' });

    // Update booking
    booking.status = 'canceled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'owner';
    await booking.save();

    // --- Hoàn tiền ---
    if (totalRefund > 0) {
      const refundTransaction = new Transaction({
        booking: booking._id,
        amount: totalRefund,
        type: 'REFUND',
        status: 'COMPLETED',
        paymentMethod: 'WALLET',
        paymentMetadata: {
          originalBookingId: booking._id,
          cancellationReason: booking.cancellationReason,
          refundType: 'TOTAL',
        },
        user: booking.renter, // Ensure user is the renter
      });
      await refundTransaction.save();
      booking.transactions.push(refundTransaction._id);
      await booking.save();
      wallet.balance += totalRefund;
      await wallet.save();
    }

    // --- Notification ---
    let notifyMsg = '';
    if (totalRefund > 0) notifyMsg = `Hoàn tiền: ${totalRefund.toLocaleString('vi-VN')} VND.`;
    else notifyMsg = 'Không có khoản tiền nào được hoàn.';
    await Notification.create({
      user: booking.renter._id,
      type: 'booking',
      title: 'Đơn đặt xe đã được huỷ',
      message: `Chủ xe đã duyệt huỷ đơn. ${notifyMsg}`,
      booking: booking._id,
      vehicle: booking.vehicle._id,
    });

    return res.status(200).json({ success: true, message: 'Đã duyệt huỷ đơn và hoàn tiền.', data: { totalRefund, newWalletBalance: wallet.balance } });
  } catch (err) {
    console.error('Error in ownerApproveCancel:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi duyệt huỷ.' });
  }
};

// Owner rejects cancellation
const ownerRejectCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('vehicle').populate('renter');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    // Only owner can reject
    if (!booking.vehicle || booking.vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối huỷ đơn này.' });
    }
    if (booking.status !== 'cancel_requested') {
      return res.status(400).json({ success: false, message: 'Đơn không ở trạng thái chờ huỷ.' });
    }
    // Khôi phục lại status trước khi huỷ
    if (booking.totalPaid >= booking.totalAmount) {
      booking.status = 'fully_paid';
    } else {
      booking.status = 'deposit_paid';
    }
    booking.cancellationReason = '';
    booking.cancelRequestedAt = null;
    booking.totalRefund = 0;
    await booking.save();
    // Notify renter
    await Notification.create({
      user: booking.renter._id,
      type: 'booking',
      title: 'Yêu cầu huỷ đơn bị từ chối',
      message: 'Chủ xe đã từ chối yêu cầu huỷ đơn của bạn. Đơn vẫn tiếp tục hoạt động.',
      booking: booking._id,
      vehicle: booking.vehicle._id,
    });
    return res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu huỷ đơn.' });
  } catch (err) {
    console.error('Error in ownerRejectCancel:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi từ chối huỷ.' });
  }
};


// Xác nhận giao xe (handover)
const confirmHandover = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
    let changed = false;
    // Chủ xe xác nhận
    if (booking.vehicle.owner.toString() === req.user._id.toString()) {
      if (!booking.ownerHandoverConfirmed) {
        booking.ownerHandoverConfirmed = true;
        changed = true;
      }
    }
    // Khách thuê xác nhận
    if (booking.renter.toString() === req.user._id.toString()) {
      if (!booking.renterHandoverConfirmed) {
        booking.renterHandoverConfirmed = true;
        changed = true;
      }
    }
    if (!changed) return res.status(400).json({ message: 'Bạn đã xác nhận rồi hoặc không có quyền.' });
    // Nếu cả hai bên đã xác nhận, chuyển trạng thái sang in_progress
    if (booking.ownerHandoverConfirmed && booking.renterHandoverConfirmed) {
      booking.status = 'in_progress';
    }
    await booking.save();
    // Gửi notification cho bên còn lại
    const notifyUser = (booking.vehicle.owner.toString() === req.user._id.toString()) ? booking.renter : booking.vehicle.owner;
    await Notification.create({
      user: notifyUser,
      type: 'booking',
      title: 'Xác nhận giao xe',
      message: `${req.user.name || req.user.email} đã xác nhận giao/nhận xe.`,
      booking: booking._id,
      vehicle: booking.vehicle._id,
    });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xác nhận giao xe', error: err.message });
  }
};

// Xác nhận trả xe (return)
const confirmReturn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
    let changed = false;
    // Chủ xe xác nhận
    if (booking.vehicle.owner.toString() === req.user._id.toString()) {
      if (!booking.ownerReturnConfirmed) {
        booking.ownerReturnConfirmed = true;
        changed = true;
      }
    }
    // Khách thuê xác nhận
    if (booking.renter.toString() === req.user._id.toString()) {
      if (!booking.renterReturnConfirmed) {
        booking.renterReturnConfirmed = true;
        changed = true;
      }
    }
    if (!changed) return res.status(400).json({ message: 'Bạn đã xác nhận rồi hoặc không có quyền.' });
    
    // Nếu cả hai bên đã xác nhận, chuyển trạng thái sang completed
    if (booking.ownerReturnConfirmed && booking.renterReturnConfirmed) {
      booking.status = 'completed';
      // Nếu payoutStatus chưa phải là 'pending' hoặc 'approved', thì set thành 'pending'
      if (booking.payoutStatus !== 'pending' && booking.payoutStatus !== 'approved') {
        booking.payoutStatus = 'pending';
      }
      // Nếu depositRefundStatus chưa phải là 'pending' hoặc 'approved', thì set thành 'pending'
      if (booking.depositRefundStatus !== 'pending' && booking.depositRefundStatus !== 'approved') {
        booking.depositRefundStatus = 'pending';
      }
    }

    await booking.save();
    // Gửi notification cho bên còn lại
    const notifyUser = (booking.vehicle.owner.toString() === req.user._id.toString()) ? booking.renter : booking.vehicle.owner;
    await Notification.create({
      user: notifyUser,
      type: 'booking',
      title: 'Xác nhận trả xe',
      message: `${req.user.name || req.user.email} đã xác nhận trả/nhận lại xe.`,
      booking: booking._id,
      vehicle: booking.vehicle._id,
    });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xác nhận trả xe', error: err.message });
  }
};

// Gửi đánh giá cho booking
const reviewBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Số sao không hợp lệ.' });
    }
    if (!review || review.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Nội dung đánh giá quá ngắn.' });
    }
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    // Chỉ người thuê mới được đánh giá
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá đơn này.' });
    }
    // Chỉ cho phép đánh giá khi đã completed và chưa có đánh giá
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá khi chuyến đi đã hoàn thành.' });
    }
    if (booking.rating || booking.review) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá đơn này rồi.' });
    }
    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Gửi thông báo cho chủ xe
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (vehicle && vehicle.owner) {
      await Notification.create({
        user: vehicle.owner,
        type: 'booking',
        title: 'Đơn thuê đã được đánh giá',
        message: `Khách thuê đã đánh giá đơn thuê #${booking._id} với ${rating} sao: \"${review.slice(0, 60)}${review.length > 60 ? '...' : ''}\"`,
        booking: booking._id,
        vehicle: vehicle._id,
      });
    }

    return res.json({ success: true, message: 'Đánh giá thành công!', booking });
  } catch (err) {
    console.error('Review booking error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá.' });
  }
};

// lấy thông tin review xe và chủ xe của id owner
const getOwnerReviews = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    // 1. Lấy các booking đã được đánh giá của các xe thuộc owner này
    const bookings = await Booking.find({
      rating: { $exists: true, $ne: null },
      review: { $exists: true, $ne: "" }
    })
      .populate({
        path: 'vehicle',
        match: { owner: ownerId }
      })
      .populate('renter', 'name avatar_url');

    // 2. Lọc booking có vehicle thuộc owner
    const filtered = bookings.filter(b => b.vehicle);

    // 3. Tính điểm trung bình, tổng số đánh giá
    const avgRating = filtered.length
      ? (filtered.reduce((sum, b) => sum + (b.rating || 0), 0) / filtered.length).toFixed(1)
      : 0;

    // 4. Chuẩn hóa danh sách review
    const reviews = filtered.map(b => ({
      name: b.renter?.name || 'Ẩn danh',
      avatar: b.renter?.avatar_url || '/default-avatar.png',
      rating: b.rating,
      content: b.review,
      date: new Date(b.updatedAt).toLocaleDateString('vi-VN')
    }));

    // 5. Lấy thông tin chủ xe
    const owner = await User.findById(ownerId);
    if (!owner) return res.status(404).json({ message: 'Không tìm thấy chủ xe.' });

    // 6. Tổng số booking của owner
    const totalBookings = await Booking.countDocuments({
      vehicle: { $in: (await Vehicle.find({ owner: ownerId }).distinct('_id')) }
    });

    res.json({
      owner: {
        name: owner.name,
        avatar: owner.avatar_url || '/default-avatar.png',
        brand: owner.brand || owner.name,
        responseRate: 100, // TODO: Tính toán thực tế nếu có
        responseTime: '5 phút', // TODO: Tính toán thực tế nếu có
        acceptanceRate: 100, // TODO: Tính toán thực tế nếu có
        avgRating,
        totalReviews: filtered.length,
        totalBookings
      },
      reviews
    });
  } catch (err) {
    console.error('getOwnerReviews error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá chủ xe' });
  }
};

const getBookingByIdForOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    // Tìm booking và populate các trường cần thiết
    const booking = await Booking.findById(id)
      .populate({
        path: 'renter',
        select: 'name email phone avatar_url driver_license_full_name driver_license_number driver_license_birth_date driver_license_image driver_license_verification_status'
      })
      .populate({
        path: 'vehicle',
        select: 'brand model year licensePlate owner',
      })
      .populate({
        path: 'transactions',
        select: 'amount type status paymentMethod paymentMetadata createdAt',
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }

    // Kiểm tra quyền: chỉ chủ xe mới được xem
    if (booking.vehicle.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn này.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('getBookingByIdForOwner error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn thuê.' });
  }
};

const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};
// API: Upload ảnh trước khi nhận/giao xe
const uploadPreDeliveryImages = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('vehicle');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    // Chỉ chủ xe được upload
    if (booking.vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền upload ảnh cho booking này.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một ảnh.' });
    }
    // Upload từng ảnh từ buffer lên cloudinary
    const urls = [];
    for (const file of req.files) {
      const result = await streamUpload(file.buffer, 'rentzy/preRentalImages');
      urls.push(result.secure_url);
    }
    // Lưu vào booking
    booking.preRentalImages = urls;
    await booking.save();
    res.json({ success: true, urls });
  } catch (err) {
    console.error('uploadPreDeliveryImages error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh.' });
  }
};
// API: Upload ảnh sau khi nhận lại xe (postRentalImages)
const uploadPostDeliveryImages = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('vehicle');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    // Chỉ chủ xe được upload
    if (booking.vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền upload ảnh cho booking này.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một ảnh.' });
    }
    // Upload từng ảnh từ buffer lên cloudinary
    const urls = [];
    for (const file of req.files) {
      const result = await streamUpload(file.buffer, 'rentzy/postRentalImages');
      urls.push(result.secure_url);
    }
    // Lưu vào booking
    booking.postRentalImages = urls;
    await booking.save();
    res.json({ success: true, urls });
  } catch (err) {
    console.error('uploadPostDeliveryImages error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh.' });
  }
};
// API lấy hợp đồng booking: trả về đầy đủ thông tin booking, renter, owner
const getBookingContract = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'renter',
        select: 'name phone driver_license_number ',
      })
      .populate({
        path: 'vehicle',
        select: 'brand model licensePlate seatCount bodyType transmission fuelType fuelConsumption location pricePerDay deposit features rentalPolicy primaryImage gallery description approvalStatus status owner',
        populate: {
          path: 'owner',
          select: 'name email phone cccd_number',
        },
      });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy hợp đồng.', error: error.message });
  }
};

function calculateDepositRefund(booking, cancelTime = new Date()) {
  const moment = require('moment');
  // Lấy transaction cọc đầu tiên thành công
  let depositTx = booking.transactions.find(
    t => (t.type === 'RENTAL' || t.type === 'DEPOSIT') && t.status === 'COMPLETED'
  );
  const depositAmount = depositTx ? depositTx.amount : Math.round((booking.totalAmount || 0) * 0.3);
  const pickupTime = new Date(booking.startDate);
  let depositTime = booking.createdAt;
  if (depositTx) depositTime = depositTx.createdAt;
  const depositTimeVN = moment(depositTime);
  const nowVN = moment(cancelTime);
  const diffMs = pickupTime - nowVN;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  // Thời gian từ lúc đặt cọc đến lúc huỷ
  const cancelSinceDeposit = nowVN.diff(depositTimeVN, 'milliseconds');
  const cancelSinceDepositHours = cancelSinceDeposit / (1000 * 60 * 60);
  const totalPaid = booking.transactions
    ? booking.transactions.filter(t => t.status === 'COMPLETED' && t.type !== 'REFUND').reduce((sum, t) => sum + t.amount, 0)
    : 0;
  const totalAmount = booking.totalAmount || 0;
  const status = booking.status;

  let refund = 0, lost = 0, policy = '', message = '';

  // --- Xác định policy ---
  if (cancelSinceDepositHours <= 1) {
    policy = 'refund_100_1h';
  } else if (diffDays > 7) {
    policy = 'refund_50';
  } else if (diffMs > 0) {
    policy = 'lost_100_7days';
  } else {
    policy = 'lost_100_after';
  }

  // --- Xử lý từng trường hợp theo status ---
  if (status === 'deposit_paid' || totalPaid < totalAmount) {
    // Chỉ thanh toán cọc
    if (policy === 'refund_100_1h') {
      refund = depositAmount;
      lost = 0;
      message = 'Bạn vừa đặt cọc, huỷ trong vòng 1 giờ sẽ được hoàn lại toàn bộ tiền cọc.';
    } else if (policy === 'refund_50') {
      refund = Math.round(depositAmount * 0.5);
      lost = depositAmount - refund;
      message = 'Bạn sẽ được hoàn lại 50% tiền cọc đã thanh toán, mất 50% còn lại.';
    } else if (policy === 'lost_100_7days') {
      refund = 0;
      lost = depositAmount;
      message = 'Bạn sẽ bị mất toàn bộ tiền cọc đã thanh toán do huỷ trong vòng 7 ngày trước khi nhận xe.';
    } else if (policy === 'lost_100_after') {
      refund = 0;
      lost = depositAmount;
      message = 'Bạn sẽ bị mất toàn bộ tiền cọc đã thanh toán do huỷ sau thời điểm nhận xe hoặc không tới nhận xe.';
    }
  } else if (status === 'fully_paid' || totalPaid >= totalAmount) {
    // Đã thanh toán toàn bộ
    if (policy === 'refund_100_1h') {
      refund = totalAmount;
      lost = 0;
      message = 'Bạn đã thanh toán đủ đơn hàng. Khi huỷ, bạn sẽ được hoàn lại toàn bộ số tiền đã thanh toán.';
    } else if (policy === 'refund_50') {
      refund = totalAmount - Math.round(depositAmount * 0.5);
      lost = Math.round(depositAmount * 0.5);
      message = 'Bạn đã thanh toán đủ đơn hàng. Khi huỷ, bạn sẽ được hoàn lại toàn bộ số tiền đã thanh toán trừ 50% tiền cọc.';
    } else if (policy === 'lost_100_7days' || policy === 'lost_100_after') {
      refund = totalAmount - depositAmount;
      lost = depositAmount;
      message = 'Bạn đã thanh toán đủ đơn hàng. Khi huỷ, bạn sẽ được hoàn lại toàn bộ số tiền đã thanh toán trừ toàn bộ tiền cọc.';
    }
  }

  return {
    refund,
    lost,
    policy,
    message,
    depositAmount,
    totalAmount,
    totalPaid,
    pickupTime,
    cancelTime,
  };
}

// API: GET /api/bookings/:id/expected-refund
const getExpectedDepositRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('transactions');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    const refundResult = calculateDepositRefund(booking, new Date());
    console.log("tiền hoàn" , refundResult.refund)
    res.status(200).json({
      success: true,
      data: {
        refund: refundResult.refund,
        lost: refundResult.lost,
        policy: refundResult.policy,
        message: refundResult.message,
        depositAmount: refundResult.depositAmount,
        totalAmount: refundResult.totalAmount,
        totalPaid: refundResult.totalPaid,
        pickupTime: refundResult.pickupTime,
        cancelTime: refundResult.cancelTime,
        // Có thể trả thêm các trường khác nếu cần
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server khi tính hoàn tiền', error: err.message });
  }
};
// controller/bookingController.js
const requestCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, totalRefund } = req.body;
    console.log("lí do huỷ " , reason );
    console.log("Số tiền  " , totalRefund );

    const booking = await Booking.findById(id).populate('vehicle');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    // Chỉ người thuê mới được gửi yêu cầu
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền yêu cầu huỷ đơn này.' });
    }
    // Chỉ cho phép khi chưa bắt đầu, chưa huỷ, chưa gửi yêu cầu
    const now = new Date();
    const startDate = new Date(booking.startDate);
    if (startDate <= now || ['canceled', 'completed', 'cancel_requested'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Không thể yêu cầu huỷ đơn này.' });
    }
    booking.status = 'cancel_requested';
    booking.cancellationReason = reason || '';
    booking.cancelRequestedAt = new Date();
    if (typeof totalRefund === 'number') booking.totalRefund = totalRefund;
    await booking.save();
    // Gửi thông báo cho chủ xe
    if (booking.vehicle && booking.vehicle.owner) {
      await Notification.create({
        user: booking.vehicle.owner,
        type: 'booking',
        title: 'Yêu cầu huỷ đơn đặt xe',
        message: `Khách thuê đã yêu cầu huỷ đơn đặt xe. Lý do: ${reason}`,
        booking: booking._id,
        vehicle: booking.vehicle._id,
      });
    }
    return res.status(200).json({ success: true, message: true });
  } catch (err) {
    console.error('Error in requestCancelBooking:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi yêu cầu huỷ.' });
  }
};


const getMyBookingReviews = async (req, res) => {
  try {
    let userId = req.user._id;
    // Nếu userId là object, chuyển sang string
    if (typeof userId === 'object' && userId.toString) {
      userId = userId.toString();
    }
    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'UserId không hợp lệ.' });
    }
    const reviews = await Booking.find({
      renter: userId,
      review: { $exists: true, $ne: '' }
    })
      .select('vehicle rating review createdAt')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy đánh giá của bạn.', error: err.message });
  }
};


module.exports = {
  getBookingByIdForOwner,
  createBooking,
  getVehicleBookedDates,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  cancelExpiredBooking,
  updatePaymentStatus,
  cancelBookingByFrontend,
  getAllBookingOfSpecificUser,

  getFilteredBookingsOfUser,
  getAllModelOfVehicle,
  getAllStatusOfBooking,
  cancelBookingByUser,
  requestCancelBooking,
  ownerApproveCancel,
  ownerRejectCancel,
  confirmHandover,
  confirmReturn,
  uploadPreDeliveryImages,
  uploadPostDeliveryImages,
  reviewBooking,
  getOwnerReviews,
  getBookingContract,
  getExpectedDepositRefund,
  getMyBookingReviews,

};
