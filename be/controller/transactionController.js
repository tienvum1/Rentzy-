const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');

// Get transaction history with exact structure
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status,
      type,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 1. Lấy tất cả ví của user
    const userWallets = await Wallet.find({ user: userId }).select('_id');
    const walletIds = userWallets.map(w => w._id);

    // 2. Lấy tất cả booking mà user là renter hoặc là owner của vehicle
    const renterBookings = await Booking.find({ renter: userId }).select('_id');
    const ownerBookings = await Booking.find().populate({
      path: 'vehicle',
      match: { owner: userId },
      select: '_id owner'
    }).select('_id vehicle');
    // Lọc booking mà vehicle.owner === userId
    const ownerBookingIds = ownerBookings
      .filter(b => b.vehicle && String(b.vehicle.owner) === String(userId))
      .map(b => b._id);
    const bookingIds = [
      ...renterBookings.map(b => b._id),
      ...ownerBookingIds
    ];

    // 3. Xây dựng query
    const query = {};
    if (bookingIds.length > 0 || walletIds.length > 0) {
      query.$or = [];
      if (bookingIds.length > 0) {
        query.$or.push({ booking: { $in: bookingIds } });
      }
      if (walletIds.length > 0) {
        query.$or.push({ wallet: { $in: walletIds } });
      }
      // Ngoài ra, các transaction nạp/rút ví mà user là user luôn (user field)
      query.$or.push({ user: userId });
    } else {
      // Không có booking hay ví nào, trả về rỗng
      return res.status(200).json({
        success: true,
        data: {
          transactions: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalTransactions: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // 4. Apply các filter
    if (status) query.status = status;
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 5. Pagination & sort
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 6. Query transaction
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    // 7. Format response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      booking: transaction.booking,
      wallet: transaction.wallet,
      user: transaction.user,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentMetadata: transaction.paymentMetadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử giao dịch',
      error: error.message
    });
  }
};


