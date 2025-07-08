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

    // Build query
    const query = {};
    
    // Tìm tất cả booking của user
    const userBookings = await Booking.find({ renter: userId }).select('_id') || [];
    const bookingIds = userBookings.map(booking => booking._id) || [];
    
    // Tìm tất cả wallet của user
    const userWallets = await Wallet.find({ user: userId }).select('_id') || [];
    const walletIds = userWallets.map(wallet => wallet._id) || [];

    // Query transactions từ booking hoặc wallet của user
    if (bookingIds.length > 0 || walletIds.length > 0) {
      query.$or = [];
      if (bookingIds.length > 0) {
        query.$or.push({ booking: { $in: bookingIds } });
      }
      if (walletIds.length > 0) {
        query.$or.push({ wallet: { $in: walletIds } });
      }
    } else {
      // Nếu user không có booking hoặc wallet nào, trả về mảng rỗng
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

    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    // Format response with exact structure requested
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      booking: transaction.booking,
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


