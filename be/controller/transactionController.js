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

    // Lấy tất cả transaction liên quan đến user (user là chủ ví hoặc là user của transaction)
    // (1) Giao dịch liên quan đến user (user field)
    // (2) Giao dịch nạp tiền vào ví của user (wallet field)
    const Wallet = require('../models/Wallet');
    const userWallets = await Wallet.find({ user: userId }).select('_id');
    const walletIds = userWallets.map(w => w._id);

    const query = {
      $or: [
        { user: userId },
        { wallet: { $in: walletIds } }
      ]
    };
    if (status) query.status = status;
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      booking: transaction.booking || null,
      user: transaction.user || null,
      wallet: transaction.wallet || null,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentMetadata: transaction.paymentMetadata || {},
      description: transaction.description || '',
      isRefunded: transaction.isRefunded,
      refundedTransaction: transaction.refundedTransaction || null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      __v: transaction.__v
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


