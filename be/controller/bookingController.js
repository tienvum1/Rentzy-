// be/controller/bookingController.js
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
// const Car = require("../models/Car");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");
const cloudinary = require('../utils/cloudinary');

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

// Hàm tính số tiền hoàn lại tiền cọc theo chính sách mới (7 ngày)
function getDepositRefund(booking) {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const deposit = booking.deposit || 0;
  // Nếu đã trong thời gian thuê thì không hoàn tiền
  if (now >= startDate && now <= endDate) {
    return 0;
  }
  const diffHours = (startDate - now) / (1000 * 60 * 60);
  if (diffHours >= 168) { // 7 ngày = 168 giờ
    return Math.round(deposit * 0.8); // Hoàn 80% cọc
  } else if (diffHours > 0) {
    return Math.round(deposit * 0.3); // Hoàn 30% cọc
  } else {
    return 0; // Đã đến giờ nhận xe hoặc muộn hơn, không hoàn
  }
}

// Hàm tính số tiền hoàn lại tổng cộng (cho trường hợp đã thanh toán toàn bộ)
function getTotalRefund(booking) {
  // Tính tổng số tiền đã thanh toán từ transactions COMPLETED
  const totalPaid = booking.transactions.reduce((sum, t) => {
    if (
      t.status === "COMPLETED" &&
      (t.type === "DEPOSIT" || t.type === "RENTAL")
    ) {
      return sum + t.amount;
    }
    return sum;
  }, 0);
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  // Nếu đã trong thời gian thuê thì không hoàn tiền
  if (now >= startDate && now <= endDate) {
    return {
      reservationRefund: 0,
      rentalRefund: 0,
      totalRefund: 0,
    };
  }
  // Nếu đã thanh toán toàn bộ (CONFIRMED hoặc RENTAL_PAID): hoàn lại tiền thuê xe + % tiền cọc
  const depositRefund = getDepositRefund(booking);
  // Tiền thuê xe đã trả = tổng đã trả - tiền cọc
  const rentalRefund = Math.max(0, totalPaid - (booking.deposit || 0));
  return {
    reservationRefund: depositRefund,
    rentalRefund,
    totalRefund: depositRefund + rentalRefund,
  };
}

// API: Hủy đơn và hoàn tiền cọc theo chính sách 2 mức
const cancelBookingWithRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const booking = await Booking.findById(id).populate("transactions");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt xe." });
    }
    // Chỉ cho phép người thuê hoặc admin hủy
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      !req.user.role.includes("admin")
    ) {
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn này." });
    }
    // Không cho hủy nếu đã thanh toán phần còn lại hoặc chuyến đi đã bắt đầu
    const now = new Date();
    const startDate = new Date(booking.startDate);
    if (startDate <= now || ["in_progress", "fully_paid", "completed"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Không thể hủy đơn đã bắt đầu hoặc đã thanh toán toàn bộ." });
    }
    // Tính số tiền hoàn lại cọc
    const depositRefund = getDepositRefund(booking);
    // Tìm ví của user
    const wallet = await Wallet.findOne({ user: booking.renter });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ví của người dùng." });
    }
    // Cập nhật trạng thái booking
    booking.status = "canceled";
    booking.cancellationReason = reason || "User canceled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = "renter";
    // Tạo transaction hoàn tiền cọc nếu có
    if (depositRefund > 0) {
      const refundDepositTransaction = new Transaction({
        booking: booking._id,
        amount: depositRefund,
        type: "REFUND",
        status: "COMPLETED",
        paymentMethod: "WALLET",
        paymentMetadata: {
          originalBookingId: booking._id,
          cancellationReason: reason || "User canceled",
          refundType: "DEPOSIT",
        },
      });
      await refundDepositTransaction.save();
      booking.transactions.push(refundDepositTransaction._id);
    }
    await booking.save();
    // Cộng tiền hoàn vào ví user
    if (depositRefund > 0) {
      wallet.balance += depositRefund;
      await wallet.save();
    }
    return res.status(200).json({
      success: true,
      message: `Đơn đã hủy thành công. Số tiền hoàn cọc: ${depositRefund.toLocaleString("vi-VN")} VND`,
      data: {
        bookingId: booking._id,
        depositRefund,
        newWalletBalance: wallet.balance,
        cancellationReason: reason || "User canceled",
        cancelledAt: booking.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Cancel booking with refund error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi hủy đơn và hoàn tiền.", error: error.message });
  }
};

// API: Lấy thông tin hoàn tiền dự kiến khi hủy đơn (chính sách mới)
const getExpectedRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("transactions");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt xe." });
    }
    // Chỉ cho phép người thuê hoặc admin xem
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      !req.user.role.includes("admin")
    ) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn này." });
    }
    // Kiểm tra có thể hủy không
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const canCancel = now < endDate && !["in_progress", "fully_paid", "completed"].includes(booking.status);
    // Tính số tiền hoàn lại
    let depositRefund = getDepositRefund(booking);
    let totalRefund = depositRefund;
    let rentalRefund = 0;
    let refundType = 'deposit';
    // Nếu đã thanh toán toàn bộ (CONFIRMED hoặc RENTAL_PAID), hoàn lại tiền thuê xe + % tiền cọc
    if (["CONFIRMED", "RENTAL_PAID", "fully_paid", "confirmed", "rental_paid"].includes(booking.status)) {
      const totalRefundObj = getTotalRefund(booking);
      depositRefund = totalRefundObj.reservationRefund;
      rentalRefund = totalRefundObj.rentalRefund;
      totalRefund = totalRefundObj.totalRefund;
      refundType = 'full';
    }
    // Tính thời gian còn lại
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
    const daysUntilStart = Math.ceil(hoursUntilStart / 24);
    // Tính tổng số tiền đã thanh toán cọc
    const totalPaid = booking.transactions.reduce((sum, t) => {
      if (t.status === "COMPLETED" && t.type === "DEPOSIT") {
        return sum + t.amount;
      }
      return sum;
    }, 0);
    return res.status(200).json({
      success: true,
      message: "Thông tin hoàn tiền dự kiến",
      data: {
        bookingId: booking._id,
        bookingStatus: booking.status,
        canCancel,
        daysUntilStart,
        totalPaid,
        deposit: booking.deposit,
        depositRefund,
        rentalRefund,
        totalRefund,
        refundType,
        refundPolicy: {
          before_7d: "Trước 7 ngày: Hoàn 80% tiền cọc",
          within_7d: "Trong 7 ngày: Hoàn 30% tiền cọc",
          during_rental: "Trong thời gian thuê: Không hoàn tiền",
          full_paid: "Nếu đã thanh toán toàn bộ: Hoàn lại tiền thuê xe + % tiền cọc theo chính sách",
        },
      },
    });
  } catch (error) {
    console.error("Get expected refund error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy thông tin hoàn tiền.", error: error.message });
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

// --- ADVANCED CANCELLATION FLOW ---
// Renter requests cancellation (status: cancel_requested)
const requestCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, totalRefund } = req.body;
    const booking = await Booking.findById(id).populate('vehicle');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
    }
    // Only renter can request
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền yêu cầu huỷ đơn này.' });
    }
    // Only allow if not started, not already canceled, not already requested
    const now = new Date();
    const startDate = new Date(booking.startDate);
    if (startDate <= now || ['canceled', 'completed', 'cancel_requested'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Không thể yêu cầu huỷ đơn này.' });
    }
    booking.status = 'cancel_requested';
    booking.cancellationReason = reason || '';
    booking.cancelRequestedAt = new Date();
    // --- Lưu thông tin hoàn tiền FE gửi lên (nếu có) ---
    if (typeof totalRefund === 'number') booking.totalRefund = totalRefund;
    await booking.save();
    // Notify owner
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
    return res.status(200).json({ success: true, message: 'Đã gửi yêu cầu huỷ đơn. Vui lòng chờ chủ xe duyệt.' });
  } catch (err) {
    console.error('Error in requestCancelBooking:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi yêu cầu huỷ.' });
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
    // Restore previous status (assume 'deposit_paid')
    booking.status = 'deposit_paid';
    booking.cancellationReason = '';
    booking.cancelRequestedAt = null;
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

// Hàm này nên được gọi khi booking hoàn thành hoặc huỷ (nếu chủ xe được nhận tiền)
async function setBookingPayoutPending(booking) {
  // Ví dụ: phí dịch vụ 10%
  const serviceFeeRate = 0.1;
  // Số tiền thực nhận của chủ xe (chỉ tính tiền thuê, không tính cọc)
  const payoutAmount = Math.round((booking.totalCost || 0) * (1 - serviceFeeRate));
  booking.payoutAmount = payoutAmount;
  booking.payoutStatus = 'pending';
  booking.payoutNote = '';
  await booking.save();
}

// Ví dụ: khi hoàn thành chuyến đi
const completeBooking = async (req, res) => {
  // ... các bước xác nhận hoàn thành ...
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
  booking.status = 'completed';
  await setBookingPayoutPending(booking);
  // ... các bước khác ...
  res.json({ success: true });
};

// Tương tự, khi huỷ mà chủ xe vẫn được nhận tiền, cũng gọi setBookingPayoutPending(booking)

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
  cancelBookingWithRefund,
  getExpectedRefund,
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
  uploadPostDeliveryImages
};
