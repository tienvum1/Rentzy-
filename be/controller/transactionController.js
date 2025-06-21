const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');

// Get all transactions for a user (both booking and wallet transactions)
exports.getUserTransactions = async (req, res) => {
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
    // Chỉ tạo $or query nếu có ít nhất một booking hoặc wallet
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
      .populate({
        path: 'booking',
        select: 'renter vehicle startDate endDate totalAmount totalCost deposit reservationFee status pickupLocation returnLocation',
        populate: [
          {
            path: 'vehicle',
            select: 'brand model year primaryImage licensePlate vehicleType'
          },
          {
            path: 'renter',
            select: 'name email phone avatar'
          }
        ]
      })
      .populate('wallet', 'balance currency status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      booking: transaction.booking ? {
        _id: transaction.booking._id,
        renter: transaction.booking.renter,
        vehicle: transaction.booking.vehicle,
        startDate: transaction.booking.startDate,
        endDate: transaction.booking.endDate,
        totalAmount: transaction.booking.totalAmount,
        totalCost: transaction.booking.totalCost,
        deposit: transaction.booking.deposit,
        reservationFee: transaction.booking.reservationFee,
        status: transaction.booking.status,
        pickupLocation: transaction.booking.pickupLocation,
        returnLocation: transaction.booking.returnLocation
      } : null,
      wallet: transaction.wallet ? {
        _id: transaction.wallet._id,
        balance: transaction.wallet.balance,
        currency: transaction.wallet.currency,
        status: transaction.wallet.status
      } : null,
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
    console.error('Error in getUserTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giao dịch',
      error: error.message
    });
  }
};

// Get transactions by wallet ID
exports.getWalletTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
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
    const userId = req.user._id;

    // Kiểm tra xem wallet có thuộc về user này không
    const wallet = await Wallet.findOne({ _id: walletId, user: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví hoặc bạn không có quyền truy cập'
      });
    }

    // Build query
    const query = { wallet: walletId };
    
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

    // Execute query
    const transactions = await Transaction.find(query)
      .populate({
        path: 'booking',
        select: 'renter vehicle startDate endDate totalAmount totalCost deposit reservationFee status',
        populate: [
          {
            path: 'vehicle',
            select: 'brand model year primaryImage licensePlate vehicleType'
          },
          {
            path: 'renter',
            select: 'name email phone avatar'
          }
        ]
      })
      .populate('wallet', 'balance currency status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      wallet: {
        _id: transaction.wallet._id,
        balance: transaction.wallet.balance,
        currency: transaction.wallet.currency,
        status: transaction.wallet.status
      },
      booking: transaction.booking ? {
        _id: transaction.booking._id,
        renter: transaction.booking.renter,
        vehicle: transaction.booking.vehicle,
        startDate: transaction.booking.startDate,
        endDate: transaction.booking.endDate,
        totalAmount: transaction.booking.totalAmount,
        totalCost: transaction.booking.totalCost,
        deposit: transaction.booking.deposit,
        reservationFee: transaction.booking.reservationFee,
        status: transaction.booking.status
      } : null,
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
    console.error('Error in getWalletTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy giao dịch ví',
      error: error.message
    });
  }
};

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

// Get transaction by ID with exact structure
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Kiểm tra quyền truy cập
    let hasAccess = false;
    
    // Kiểm tra nếu transaction thuộc về booking của user
    if (transaction.booking) {
      const booking = await Booking.findById(transaction.booking);
      if (booking && booking.renter.toString() === userId.toString()) {
        hasAccess = true;
      }
    }
    
    // Kiểm tra nếu transaction thuộc về wallet của user
    if (transaction.wallet) {
      const wallet = await Wallet.findById(transaction.wallet);
      if (wallet && wallet.user.toString() === userId.toString()) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập giao dịch này'
      });
    }

    // Return with exact structure
    res.status(200).json({
      success: true,
      data: {
        _id: transaction._id,
        booking: transaction.booking,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        paymentMetadata: transaction.paymentMetadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in getTransactionById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết giao dịch',
      error: error.message
    });
  }
};

// Get transaction statistics for user
exports.getTransactionStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Tìm tất cả booking và wallet của user
    const userBookings = await Booking.find({ renter: userId }).select('_id') || [];
    const bookingIds = userBookings.map(booking => booking._id) || [];
    
    const userWallets = await Wallet.find({ user: userId }).select('_id') || [];
    const walletIds = userWallets.map(wallet => wallet._id) || [];

    // Build query
    const query = {};
    
    // Chỉ tạo $or query nếu có ít nhất một booking hoặc wallet
    if (bookingIds.length > 0 || walletIds.length > 0) {
      query.$or = [];
      if (bookingIds.length > 0) {
        query.$or.push({ booking: { $in: bookingIds } });
      }
      if (walletIds.length > 0) {
        query.$or.push({ wallet: { $in: walletIds } });
      }
    } else {
      // Nếu user không có booking hoặc wallet nào, trả về thống kê rỗng
      return res.status(200).json({
        success: true,
        data: {
          overall: {
            totalTransactions: 0,
            totalAmount: 0,
            avgAmount: 0,
            minAmount: 0,
            maxAmount: 0
          },
          byType: [],
          byStatus: [],
          byPaymentMethod: []
        }
      });
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

    // Get statistics
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);

    // Get statistics by type
    const statsByType = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get statistics by status
    const statsByStatus = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get statistics by payment method
    const statsByPaymentMethod = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      overall: stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        minAmount: 0,
        maxAmount: 0
      },
      byType: statsByType,
      byStatus: statsByStatus,
      byPaymentMethod: statsByPaymentMethod
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in getTransactionStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê giao dịch',
      error: error.message
    });
  }
};
