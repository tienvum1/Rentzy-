const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');

// Get transaction history with exact structure
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
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

    // 1. Query only by user field
    const query = { user: userId };

    // 2. Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 3. Pagination & sort
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 4. Query transaction
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    // 5. Format response
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


