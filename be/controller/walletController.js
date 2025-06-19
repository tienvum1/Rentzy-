const Wallet = require('../models/Wallet');

// Lấy thông tin ví của user hiện tại
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Không tìm thấy ví.' });
    }
    res.json({ wallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin ví.' });
  }
};
