const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');


// Get user's transactions with booking and renter info
exports.getUserTransactions = async (req, res) => {
  try {
    const status = req.query.status;
    const userId = req.user._id;

    // Tìm tất cả booking của user
    const userBookings = await Booking.find({ renter: userId }).select('_id');
    const bookingIds = userBookings.map(booking => booking._id);

    // Tìm transactions dựa trên bookingIds
    const query = { booking: { $in: bookingIds } };
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate({
        path: 'booking',
        select: 'renter vehicle startDate endDate totalAmount status',
        populate: [
          {
            path: 'vehicle',
            select: 'brand model primaryImage'
          },
          {
            path: 'renter',
            select: 'name email phone'
          }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      transactions: transactions.map(transaction => ({
        _id: transaction._id,
        booking: {
          _id: transaction.booking._id,
          renter: transaction.booking.renter,
          vehicle: transaction.booking.vehicle,
          startDate: transaction.booking.startDate,
          endDate: transaction.booking.endDate,
          totalAmount: transaction.booking.totalAmount,
          status: transaction.booking.status
        },
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        paymentMetadata: transaction.paymentMetadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error in getUserTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
