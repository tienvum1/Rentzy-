const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');
const axios = require('axios');

// MoMo configuration cho wallet deposit
const MOMO_CONFIG = {
    partnerCode: "MOMO",
    accessKey: "F8BBA842ECF85",
    secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
    baseUrl: "https://test-payment.momo.vn/v2/gateway/api/create"
};

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

// Tạo yêu cầu nạp tiền qua MoMo
exports.createDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || isNaN(amount) || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền nạp phải từ 10,000 VND trở lên'
      });
    }

    // Kiểm tra ví của user
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      // Tạo ví mới nếu chưa có
      wallet = new Wallet({
        user: userId,
        balance: 0,
        currency: 'VND',
        status: 'active'
      });
      await wallet.save();
    }

    // Tạo request ID và order ID cho MoMo
    const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
    const uniqueOrderId = `WALLET-${userId}-${requestId}`;
    const orderInfo = `Nạp tiền vào ví - ${amount.toLocaleString('vi-VN')} VND`;

    // URLs cho MoMo
    const redirectUrl = `${process.env.BACKEND_URL}/api/wallet/deposit-callback`;
    const ipnUrl = `${process.env.BACKEND_URL}/api/wallet/deposit-webhook`;
    const extraData = "";

    // Tạo raw signature cho API MoMo
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${uniqueOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

    console.log('Raw signature for wallet deposit:', rawSignature);
    
    // Tạo signature (HMAC SHA256)
    const signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    console.log('Generated signature for wallet deposit:', signature);

    // Request body gửi đến MoMo
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      amount: amount.toString(),
      orderId: uniqueOrderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: "captureWallet",
      signature: signature,
      lang: 'vi'
    };

    console.log('Sending wallet deposit request to MoMo:', {
      ...requestBody,
      signature: '***'
    });

    // Gửi yêu cầu đến MoMo
    const response = await axios.post(MOMO_CONFIG.baseUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('MoMo response for wallet deposit:', response.data);

    if (response.data.resultCode !== 0) {
      return res.status(400).json({
        success: false,
        message: `Lỗi MoMo: ${response.data.message || 'Không thể tạo yêu cầu thanh toán'}`
      });
    }

    // Tạo transaction record
    const transaction = new Transaction({
      wallet: wallet._id,
      amount: amount,
      type: 'WALLET_DEPOSIT',
      status: 'PENDING',
      paymentMethod: 'MOMO',
      paymentMetadata: {
        requestId: requestId,
        orderId: uniqueOrderId,
        orderInfo: orderInfo,
        paymentMethod: 'MOMO',
        paymentStatus: 'PENDING'
      }
    });
    await transaction.save();

    // Trả về URL thanh toán MoMo
    res.json({
      success: true,
      message: 'Tạo yêu cầu nạp tiền thành công',
      paymentUrl: response.data.payUrl,
      orderId: uniqueOrderId,
      requestId: requestId
    });

  } catch (error) {
    console.error('Error creating wallet deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo yêu cầu nạp tiền'
    });
  }
};

// Callback từ MoMo sau khi thanh toán
exports.depositCallback = async (req, res) => {
  try {
    const { resultCode, orderId, requestId, amount, message } = req.query;
    
    console.log('Wallet deposit callback received:', req.query);

    if (resultCode === '0') {
      // Thanh toán thành công
      const transaction = await Transaction.findOne({
        'paymentMetadata.requestId': requestId,
        type: 'WALLET_DEPOSIT',
        status: 'PENDING'
      });

      if (transaction) {
        // Cập nhật trạng thái transaction
        transaction.status = 'COMPLETED';
        await transaction.save();

        // Cập nhật số dư ví
        const wallet = await Wallet.findById(transaction.wallet);
        if (wallet) {
          wallet.balance += parseInt(amount);
          await wallet.save();
        }

        // Redirect về frontend với thông báo thành công
        res.redirect(`${process.env.FRONTEND_URL}/profile/wallet?status=success&amount=${amount}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/profile/wallet?status=error&message=Không tìm thấy giao dịch`);
      }
    } else {
      // Thanh toán thất bại
      const transaction = await Transaction.findOne({
        'paymentMetadata.requestId': requestId,
        type: 'WALLET_DEPOSIT'
      });
      
      if (transaction) {
        transaction.status = 'FAILED';
        await transaction.save();
      }

      res.redirect(`${process.env.FRONTEND_URL}/profile/wallet?status=error&message=${message || 'Thanh toán thất bại'}`);
    }
  } catch (error) {
    console.error('Error in wallet deposit callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/profile/wallet?status=error&message=Lỗi xử lý thanh toán`);
  }
};

// Webhook từ MoMo (IPN)
exports.depositWebhook = async (req, res) => {
  try {
    const { resultCode, orderId, requestId, amount, message } = req.body;
    
    console.log('Wallet deposit webhook received:', req.body);

    if (resultCode === '0') {
      // Thanh toán thành công
      const transaction = await Transaction.findOne({
        'paymentMetadata.requestId': requestId,
        type: 'WALLET_DEPOSIT',
        status: 'PENDING'
      });

      if (transaction) {
        // Cập nhật trạng thái transaction
        transaction.status = 'COMPLETED';
        await transaction.save();

        // Cập nhật số dư ví
        const wallet = await Wallet.findById(transaction.wallet);
        if (wallet) {
          wallet.balance += parseInt(amount);
          await wallet.save();
          console.log(`Wallet deposit completed: ${amount} VND for wallet ${wallet._id}`);
        }
      }
    } else {
      // Thanh toán thất bại
      const transaction = await Transaction.findOne({
        'paymentMetadata.requestId': requestId,
        type: 'WALLET_DEPOSIT'
      });
      
      if (transaction) {
        transaction.status = 'FAILED';
        await transaction.save();
      }
    }

    // Trả về success cho MoMo
    res.json({ success: true });
  } catch (error) {
    console.error('Error in wallet deposit webhook:', error);
    res.status(500).json({ success: false });
  }
};

// Tạo yêu cầu rút tiền (chờ admin duyệt)
exports.createWithdraw = async (req, res) => {
  try {
    const { amount, accountName, accountNumber, bankName } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!amount || !accountName || !accountNumber || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Validate amount
    if (isNaN(amount) || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền rút phải từ 10,000 VND trở lên'
      });
    }

    // Kiểm tra ví của user
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    // Kiểm tra số dư
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Số dư không đủ để rút tiền'
      });
    }

    // Tạo transaction rút tiền với status PENDING
    const transaction = new Transaction({
      wallet: wallet._id,
      amount: amount,
      type: 'WALLET_WITHDRAW',
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      paymentMetadata: {
        accountName: accountName,
        accountNumber: accountNumber,
        bankName: bankName,
        requestType: 'WITHDRAW',
        requestStatus: 'PENDING',
        requestDate: new Date().toISOString()
      }
    });
    await transaction.save();

    // Trừ tiền tạm thời khỏi ví (có thể hoàn lại nếu admin từ chối)
    wallet.balance -= amount;
    await wallet.save();

    console.log(`Withdraw request created: ${amount} VND for user ${userId}`);

    res.json({
      success: true,
      message: 'Yêu cầu rút tiền đã được gửi thành công',
      transactionId: transaction._id
    });

  } catch (error) {
    console.error('Error creating withdraw request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo yêu cầu rút tiền'
    });
  }
};

// Admin: Duyệt yêu cầu rút tiền
exports.approveWithdraw = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action } = req.body; // 'approve' hoặc 'reject'

    // Tìm transaction
    const transaction = await Transaction.findById(transactionId)
      .populate('wallet');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    if (transaction.type !== 'WALLET_WITHDRAW') {
      return res.status(400).json({
        success: false,
        message: 'Không phải giao dịch rút tiền'
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không ở trạng thái chờ duyệt'
      });
    }

    if (action === 'approve') {
      // Duyệt rút tiền
      transaction.status = 'COMPLETED';
      transaction.paymentMetadata.set('approvedBy', req.user._id);
      transaction.paymentMetadata.set('approvedAt', new Date().toISOString());
      transaction.paymentMetadata.set('requestStatus', 'APPROVED');
      await transaction.save();

      // Số dư đã được trừ từ trước, không cần trừ nữa
      console.log(`Withdraw approved: ${transaction.amount} VND for wallet ${transaction.wallet._id}`);

      res.json({
        success: true,
        message: 'Đã duyệt yêu cầu rút tiền thành công'
      });

    } else if (action === 'reject') {
      // Từ chối rút tiền
      transaction.status = 'FAILED';
      transaction.paymentMetadata.set('rejectedBy', req.user._id);
      transaction.paymentMetadata.set('rejectedAt', new Date().toISOString());
      transaction.paymentMetadata.set('requestStatus', 'REJECTED');
      await transaction.save();

      // Hoàn lại số dư cho ví
      const wallet = await Wallet.findById(transaction.wallet);
      if (wallet) {
        wallet.balance += transaction.amount;
        await wallet.save();
      }

      console.log(`Withdraw rejected: ${transaction.amount} VND for wallet ${transaction.wallet._id}`);

      res.json({
        success: true,
        message: 'Đã từ chối yêu cầu rút tiền'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Hành động không hợp lệ'
      });
    }

  } catch (error) {
    console.error('Error processing withdraw request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu rút tiền'
    });
  }
};

// Lấy danh sách yêu cầu rút tiền chờ duyệt (cho admin)
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const pendingWithdrawals = await Transaction.find({
      type: 'WALLET_WITHDRAW',
      status: 'PENDING'
    })
    .populate('wallet', 'user balance currency')
    .populate({
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      withdrawals: pendingWithdrawals
    });

  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách yêu cầu rút tiền'
    });
  }
};
