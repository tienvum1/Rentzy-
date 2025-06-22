//https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
//parameters
var partnerCode = "MOMO";
var accessKey = "F8BBA842ECF85";
var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
var requestId = partnerCode + new Date().getTime();
var orderId = requestId;
var orderInfo = "pay with MoMo";
var redirectUrl = "https://momo.vn/return";
var ipnUrl = "https://callback.url/notify";
// var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
var amount = "50000";
var requestType = "captureWallet"
var extraData = ""; //pass empty value if your merchant does not have stores

//before sign HMAC SHA256 with format
//accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
var rawSignature = "accessKey="+accessKey+"&amount=" + amount+"&extraData=" + extraData+"&ipnUrl=" + ipnUrl+"&orderId=" + orderId+"&orderInfo=" + orderInfo+"&partnerCode=" + partnerCode +"&redirectUrl=" + redirectUrl+"&requestId=" + requestId+"&requestType=" + requestType
//puts raw signature
console.log("--------------------RAW SIGNATURE----------------")
console.log(rawSignature)
//signature
const crypto = require('crypto');
var signature = crypto.createHmac('sha256', secretkey)
    .update(rawSignature)
    .digest('hex');
console.log("--------------------SIGNATURE----------------")
console.log(signature)

//json object send to MoMo endpoint
const requestBody = JSON.stringify({
    partnerCode : partnerCode,
    accessKey : accessKey,
    requestId : requestId,
    amount : amount,
    orderId : orderId,
    orderInfo : orderInfo,
    redirectUrl : redirectUrl,
    ipnUrl : ipnUrl,
    extraData : extraData,
    requestType : requestType,
    signature : signature,
    lang: 'en'
});

const axios = require('axios');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { cancelExpiredBooking } = require('./bookingController'); // Import the new function
const Wallet = require('../models/Wallet');

// MoMo configuration (Sử dụng thông tin test hoặc thông tin thật của bạn)
const MOMO_CONFIG = {
    partnerCode: "MOMO",
    accessKey: "F8BBA842ECF85",
    secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz", // Đảm bảo secretKey chính xác
    baseUrl: "https://test-payment.momo.vn/v2/gateway/api/create" // Base URL của MoMo API
};

// Hàm tạo thanh toán MoMo
const createPayment = async (req, res) => {
    try {
        console.log(' gọi thành công');
        const { amount, orderInfo, orderCode } = req.body; // orderCode ở đây là booking._id
        console.log("BACKEND_URL from env:", process.env.BACKEND_URL);
        console.log(req.body);
        // Validate required fields
        if (!amount || !orderInfo || !orderCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: amount, orderInfo, orderCode'
            });
        }

        // Validate amount is a number
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        console.log('Creating payment with data:', {
            amount,
            orderInfo,
            orderCode
        });

        // Kiểm tra xem booking có còn hợp lệ (chưa hết hạn thanh toán) không
        const bookingStatusCheck = await cancelExpiredBooking(orderCode);
        if (!bookingStatusCheck.success) {
            if (bookingStatusCheck.message === "Booking expired and canceled.") {
                return res.status(400).json({
                    success: false,
                    message: 'Booking has expired and been canceled. Please create a new booking.'
                });
            } else if (bookingStatusCheck.message === "Booking not in pending status.") {
                return res.status(400).json({
                    success: false,
                    message: 'Booking is no longer in pending status and cannot be paid for.'
                });
            } else if (bookingStatusCheck.message === "Booking not found.") {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found for payment.'
                });
            }
        }

        const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
        // orderId duy nhất cho mỗi yêu cầu MoMo, dùng để theo dõi trên MoMo và trong transaction metadata
        const uniqueMoMoOrderId = `${orderCode}-${requestId}`;
        // redirectUrl: MoMo sẽ chuyển hướng trình duyệt về đây sau khi thanh toán xong
        const redirectUrl = `${process.env.BACKEND_URL}/api/momo/check-payment`;
        // ipnUrl: MoMo sẽ gửi thông báo xác nhận thanh toán cuối cùng về đây (webhook)
        const ipnUrl = `${process.env.BACKEND_URL}/api/momo/webhook`;
        const extraData = "";

        // Tìm kiếm giao dịch MoMo đang chờ xử lý cho booking này
        let transaction = await Transaction.findOne({
            booking: orderCode,
            paymentMethod: 'MOMO',
            status: 'PENDING'
        });

        // Nếu có giao dịch đang chờ xử lý, tái sử dụng và cập nhật MoMo-specific IDs
        if (transaction) {
            console.log('Existing pending MoMo transaction found. Reusing and updating...');
            transaction.paymentMetadata.momoRequestId = requestId;
            transaction.paymentMetadata.momoOrderId = uniqueMoMoOrderId;
            await transaction.save();
        } else {
            // Nếu không có, tạo một bản ghi giao dịch mới
            console.log('No pending MoMo transaction found. Creating a new one...');
            transaction = new Transaction({
                booking: orderCode, // Booking ID gốc
                amount: amount,
                type: 'DEPOSIT',
                status: 'PENDING',
                paymentMethod: 'MOMO',
                paymentMetadata: {
                    orderCode: orderCode, // Booking ID gốc
                    paymentMethod: 'MOMO',
                    paymentStatus: 'PENDING',
                    momoRequestId: requestId,
                    momoOrderId: uniqueMoMoOrderId // Unique MoMo order ID cho lần thử này
                }
            });
            await transaction.save();
            
            // Cập nhật booking với transaction ID mới
            const booking = await Booking.findById(orderCode);
            if (booking) {
                booking.transactions.push(transaction._id);
                await booking.save();
            }
        }

        // Tạo raw signature cho API MoMo
        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${uniqueMoMoOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

        console.log('Raw signature:', rawSignature);
        
        // Tạo signature (HMAC SHA256)
        const signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
            .update(rawSignature)
            .digest('hex');

        console.log('Generated signature:', signature);

        // Request body gửi đến MoMo
        const requestBody = {
            partnerCode: MOMO_CONFIG.partnerCode,
            accessKey: MOMO_CONFIG.accessKey,
            requestId: requestId,
            amount: amount.toString(), // amount phải là string
            orderId: uniqueMoMoOrderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: "captureWallet",
            signature: signature,
            lang: 'vi' // Ngôn ngữ
        };

        console.log('Sending request to MoMo with data:', {
            ...requestBody,
            signature: '***' // Ẩn signature trong logs
        });

        // Gửi yêu cầu đến MoMo
        const response = await axios.post(MOMO_CONFIG.baseUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('MoMo response:', response.data);

        if (response.data.resultCode !== 0) {
            throw new Error(response.data.message || 'Payment creation failed');
        }

        res.json({
            success: true,
            paymentUrl: response.data.payUrl
        });
    } catch (error) {
        console.error('Payment creation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment',
            error: error.response?.data?.message || error.message
        });
    }
};

// Hàm xử lý kết quả trả về từ MoMo (redirectUrl)
const checkPayment = async (req, res) => {
    try {
        console.log('MoMo Check Payment Callback Received:', req.query);

        const { partnerCode, accessKey, requestId, amount, orderId, orderInfo, resultCode, message, signature, transId, payType, responseTime, extraData } = req.query;

        // Lấy lại orderCode (booking ID) từ orderId của MoMo
        const bookingId = orderId.split('-')[0];
        // Thay đổi URL chuyển hướng đến trang PaymentDeposit
        const frontendRedirectUrl = `${process.env.FRONTEND_URL}/payment-deposit/${bookingId}`;

        // Tìm giao dịch liên quan trong DB
        let transaction = await Transaction.findOne({ 
            'paymentMetadata.momoOrderId': orderId 
        });

        if (!transaction) {
            console.error('MoMo Check Payment: Transaction not found for orderId:', orderId);
            return res.redirect(`${frontendRedirectUrl}?resultCode=1&message=Không tìm thấy giao dịch`);
        }

        // Cập nhật trạng thái giao dịch dựa trên resultCode từ MoMo
        if (parseInt(resultCode) === 0) {
            // Thanh toán thành công
            transaction.status = 'COMPLETED';
            transaction.paymentMetadata.paymentStatus = 'COMPLETED';
            transaction.paymentMetadata.momoTransId = transId;
            await transaction.save();

            // Cập nhật trạng thái booking
            const booking = await Booking.findById(bookingId);
            if (booking) {
                // Nếu giao dịch là DEPOSIT, cập nhật trạng thái booking thành DEPOSIT_PAID
                if (transaction.type === 'DEPOSIT') {
                    if (booking.status === 'pending') { 
                        booking.status = 'DEPOSIT_PAID';
                    }
                }
                // Nếu giao dịch là RENTAL, cập nhật trạng thái booking thành CONFIRMED
                else if (transaction.type === 'RENTAL') {
                    if (booking.status === 'DEPOSIT_PAID' || booking.status === 'CONFIRMED') {
                        booking.status = 'CONFIRMED';
                    }
                }
                await booking.save();
            }
            console.log('MoMo Check Payment: Payment successful for booking:', bookingId);
            return res.redirect(`${frontendRedirectUrl}?resultCode=0&message=Thanh toán thành công`);
        } else {
            // Thanh toán thất bại
            transaction.status = 'FAILED';
            transaction.paymentMetadata.paymentStatus = 'FAILED';
            transaction.paymentMetadata.momoTransId = transId;
            await transaction.save();

            // Không thay đổi trạng thái booking ở đây, để webhook xử lý hoặc người dùng retry
            console.log('MoMo Check Payment: Payment failed for booking:', bookingId, 'Result Code:', resultCode, 'Message:', message);
            return res.redirect(`${frontendRedirectUrl}?resultCode=${resultCode}&message=${encodeURIComponent(message)}`);
        }
    } catch (error) {
        console.error('Error in checkPayment:', error);
        // Đảm bảo chuyển hướng về frontend ngay cả khi có lỗi nội bộ
        const bookingIdFromError = req.query.orderId ? req.query.orderId.split('-')[0] : 'unknown';
        const frontendRedirectUrl = `${process.env.FRONTEND_URL}/payment-deposit/${bookingIdFromError}`;
        return res.redirect(`${frontendRedirectUrl}?resultCode=1&message=${encodeURIComponent('Có lỗi xảy ra trong quá trình xử lý thanh toán.')}`);
    }
};

// Hàm xử lý IPN (Instant Payment Notification) từ MoMo (webhook)
const handleWebhook = async (req, res) => {
    try {
        console.log('MoMo IPN Webhook Received:', req.body);

        const {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId, // Unique MoMo order ID
            orderInfo,
            message,
            resultCode,
            signature,
            transId,
            payType,
            responseTime,
            extraData
        } = req.body;

        // Lấy lại orderCode (booking ID) từ orderId của MoMo
        const bookingId = orderId.split('-')[0];

        // Xác minh chữ ký (quan trọng để đảm bảo tính toàn vẹn và xác thực của dữ liệu)
        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&requestId=${requestId}&resultCode=${resultCode}&responseTime=${responseTime}&transId=${transId}&requestType=captureWallet`;
        const expectedSignature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
            .update(rawSignature)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('MoMo IPN Webhook: Signature mismatch!');
            return res.status(400).json({ status: 'failed', message: 'Signature mismatch' });
        }

        // Tìm giao dịch liên quan trong DB
        let transaction = await Transaction.findOne({ 
            'paymentMetadata.momoOrderId': orderId 
        });

        if (!transaction) {
            console.error('MoMo IPN Webhook: Transaction not found for orderId:', orderId);
            return res.status(404).json({ status: 'failed', message: 'Transaction not found' });
        }

        // Cập nhật trạng thái giao dịch và booking
        if (parseInt(resultCode) === 0) {
            // Thanh toán thành công
            if (transaction.status === 'PENDING') { // Chỉ cập nhật nếu đang pending
                transaction.status = 'COMPLETED';
                transaction.paymentMetadata.paymentStatus = 'COMPLETED';
                transaction.paymentMetadata.momoTransId = transId;
                await transaction.save();

                // Cập nhật trạng thái booking
                const booking = await Booking.findById(bookingId);
                if (booking) {
                    if (transaction.type === 'DEPOSIT') {
                        if (booking.status === 'pending') {
                            booking.status = 'DEPOSIT_PAID';
                        }
                    } else if (transaction.type === 'RENTAL') {
                        if (booking.status === 'DEPOSIT_PAID' || booking.status === 'CONFIRMED') {
                            booking.status = 'CONFIRMED';
                        }
                    }
                    await booking.save();
                }
                console.log('MoMo IPN Webhook: Payment successful for booking:', bookingId);
            } else {
                console.log('MoMo IPN Webhook: Transaction already processed or not pending for booking:', bookingId);
            }
        } else {
            // Thanh toán thất bại hoặc hủy
            if (transaction.status === 'PENDING') { // Chỉ cập nhật nếu đang pending
                transaction.status = 'FAILED'; // Hoặc CANCELED
                transaction.paymentMetadata.paymentStatus = 'FAILED';
                transaction.paymentMetadata.momoResultMessage = message;
                transaction.paymentMetadata.momoResultCode = resultCode;
                await transaction.save();

                const booking = await Booking.findById(bookingId);
                if (booking) {
                    if (transaction.type === 'DEPOSIT') {
                        // Nếu giao dịch DEPOSIT thất bại và booking đang pending, và không còn giao dịch pending nào khác
                        if (booking.status === 'pending') {
                            const otherPendingTransactions = await Transaction.countDocuments({
                                booking: bookingId,
                                paymentMethod: 'MOMO',
                                status: 'PENDING',
                                _id: { $ne: transaction._id } // Loại trừ giao dịch hiện tại
                            });
                            if (otherPendingTransactions === 0) {
                                booking.status = 'canceled';
                                await booking.save();
                                console.log('MoMo IPN Webhook: Booking canceled due to DEPOSIT payment failure:', bookingId);
                            }
                        }
                    } else if (transaction.type === 'RENTAL') {
                        // Nếu giao dịch RENTAL thất bại, không thay đổi trạng thái booking (vẫn là DEPOSIT_PAID)
                        console.log('MoMo IPN Webhook: RENTAL payment failed, booking status remains as is:', bookingId);
                    }
                }
            }
            console.error('MoMo IPN Webhook: Payment failed for booking:', bookingId, 'Result Code:', resultCode, 'Message:', message);
        }

        res.status(200).json({ status: 'success', message: 'IPN received and processed' });

    } catch (error) {
        console.error('Error in MoMo IPN Webhook:', error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

const verifyMoMoPayment = async (req, res) => {
    try {
        const {
            resultCode,
            message,
            orderId,
            amount,
            partnerCode,
            requestType,
            sid
        } = req.body;

        // Kiểm tra các tham số bắt buộc
        if (!resultCode || !orderId || !amount || !partnerCode || !requestType || !sid) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin xác minh thanh toán'
            });
        }

        // Kiểm tra resultCode
        if (resultCode !== '0') {
            return res.status(400).json({
                success: false,
                message: 'Thanh toán không thành công'
            });
        }

        // Tìm giao dịch dựa trên orderId
        const transaction = await Transaction.findOne({
            orderCode: orderId,
            paymentMethod: 'MOMO'
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        // Kiểm tra số tiền
        if (parseInt(amount) !== transaction.amount) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền không khớp'
            });
        }

        // Cập nhật trạng thái giao dịch
        transaction.status = 'COMPLETED';
        transaction.paymentMetadata = {
            ...transaction.paymentMetadata,
            momoTransId: sid,
            paymentStatus: 'COMPLETED',
            partnerCode,
            requestType,
            resultCode,
            message
        };
        await transaction.save();

        // Cập nhật trạng thái booking
        const booking = await Booking.findById(transaction.booking);
        if (booking) {
            booking.status = 'DEPOSIT_PAID';
            await booking.save();
        }

        res.status(200).json({
            success: true,
            message: 'Xác minh thanh toán thành công',
            data: {
                transaction,
                booking
            }
        });

    } catch (error) {
        console.error('Verify MoMo payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác minh thanh toán'
        });
    }
};

// Hàm tạo thanh toán phần còn lại (RENTAL)
const createRentalPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        console.log("Payment request body:", req.body);

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Missing bookingId in request body'
            });
        }

        const booking = await Booking.findById(bookingId).populate('transactions');
        console.log("Found booking:", booking);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found.'
            });
        }

        // Kiểm tra trạng thái booking: đã thanh toán tiền giữ chỗ và chưa hoàn thành
        if (booking.status !== 'DEPOSIT_PAID') {
            return res.status(400).json({
                success: false,
                message: 'Booking is not in DEPOSIT_PAID status. Cannot proceed with rental payment.'
            });
        }

        // Tính toán số tiền cần thanh toán
        console.log("All transactions:", booking.transactions);
        const totalPaidAmount = booking.transactions.reduce((sum, transaction) => {
            console.log("Processing transaction:", transaction);
            if (transaction.status === 'COMPLETED' && transaction.type === 'DEPOSIT') {
                console.log("Adding deposit amount:", transaction.amount);
                return sum + transaction.amount;
            }
            return sum;
        }, 0);

        console.log("Total paid amount:", totalPaidAmount);
        console.log("Booking total amount:", booking.totalAmount);

        const amountToPay = booking.totalAmount - totalPaidAmount - totalPaidAmount;
        console.log("Amount to pay:", amountToPay);

        if (amountToPay <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No remaining amount to pay or booking is fully paid.'
            });
        }

        // Khởi tạo giao dịch MoMo cho tiền còn lại
        const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
        const uniqueMoMoOrderId = `${bookingId}-${requestId}-RENTAL`; // Thêm hậu tố RENTAL để phân biệt
        const orderInfo = `Thanh toán phần còn lại cho đơn hàng ${bookingId}`;
        // redirectUrl: MoMo sẽ chuyển hướng trình duyệt về đây sau khi thanh toán xong
        const redirectUrl = `${process.env.BACKEND_URL}/api/momo/check-rental-payment`;
        const ipnUrl = `${process.env.BACKEND_URL}/api/momo/webhook`;
        const extraData = "";

        // Tạo giao dịch loại RENTAL
        let transaction = new Transaction({
            booking: bookingId,
            amount: amountToPay,
            type: 'RENTAL',
            status: 'PENDING',
            paymentMethod: 'MOMO',
            paymentMetadata: {
                orderCode: bookingId,
                paymentMethod: 'MOMO',
                paymentStatus: 'PENDING',
                momoRequestId: requestId,
                momoOrderId: uniqueMoMoOrderId,
                originalBookingStatus: booking.status
            }
        });
        await transaction.save();

        // Thêm transaction vào booking
        booking.transactions.push(transaction._id);
        await booking.save();

        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amountToPay}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${uniqueMoMoOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

        const signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode: MOMO_CONFIG.partnerCode,
            accessKey: MOMO_CONFIG.accessKey,
            requestId: requestId,
            amount: amountToPay.toString(),
            orderId: uniqueMoMoOrderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: "captureWallet",
            signature: signature,
            lang: 'vi'
        };

        const response = await axios.post(MOMO_CONFIG.baseUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.data.resultCode !== 0) {
            throw new Error(response.data.message || 'Failed to create rental payment');
        }

        res.json({
            success: true,
            paymentUrl: response.data.payUrl,
            message: 'Rental payment initiated successfully.'
        });

    } catch (error) {
        console.error('Rental payment creation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create rental payment',
            error: error.response?.data?.message || error.message
        });
    }
};

// Hàm kiểm tra thanh toán phần còn lại (RENTAL)
const checkRentalPayment = async (req, res) => {
    try {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            bookingId
        } = req.query;

        console.log("Received payment callback:", req.query);

        // Nếu là callback từ MoMo
        if (orderId) {
            // Extract booking ID from orderId (format: bookingId-requestId-RENTAL)
            const extractedBookingId = orderId.split('-')[0];
            const booking = await Booking.findById(extractedBookingId);
            if (!booking) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Booking not found`);
            }

            // Find the pending transaction
            const transaction = await Transaction.findOne({
                booking: extractedBookingId,
                'paymentMetadata.momoOrderId': orderId,
                status: 'PENDING'
            });

            if (!transaction) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Transaction not found`);
            }

            // Nếu resultCode = 0 (thanh toán thành công)
            if (resultCode === '0') {
                // Update transaction status
                transaction.status = 'COMPLETED';
                transaction.paymentMetadata.paymentStatus = 'COMPLETED';
                transaction.paymentMetadata.momoTransId = transId;
                await transaction.save();

                // Update booking status to RENTAL_PAID
                booking.status = 'RENTAL_PAID';
                await booking.save();

                // Redirect to booking details page with success message
                const frontendRedirectUrl = `${process.env.FRONTEND_URL}/bookings/${extractedBookingId}`;
                return res.redirect(`${frontendRedirectUrl}?resultCode=0&message=${encodeURIComponent('Thanh toán thành công')}`);
            } else {
                // Update transaction status to failed
                transaction.status = 'FAILED';
                transaction.paymentMetadata.paymentStatus = 'FAILED';
                await transaction.save();
                
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${message}`);
            }
        }
        // Nếu chỉ có bookingId (từ API call trực tiếp)
        else if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Find the latest pending transaction
            const transaction = await Transaction.findOne({
                booking: bookingId,
                status: 'PENDING'
            }).sort({ createdAt: -1 });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'No pending transaction found'
                });
            }

            // Gọi API check-payment để xác minh giao dịch
            try {
                const checkPaymentResponse = await axios.get(
                    `${process.env.BACKEND_URL}/api/momo/check-payment?bookingId=${bookingId}&orderId=${transaction.paymentMetadata.momoOrderId}`,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!checkPaymentResponse.data.success) {
                    throw new Error(checkPaymentResponse.data.message || 'Payment verification failed');
                }

                // Update transaction status
                transaction.status = 'COMPLETED';
                transaction.paymentMetadata.paymentStatus = 'COMPLETED';
                await transaction.save();

                // Update booking status to RENTAL_PAID
                booking.status = 'RENTAL_PAID';
                await booking.save();

                return res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    bookingId: bookingId,
                    transactionId: transaction._id
                });

            } catch (checkError) {
                console.error('Error checking payment status:', checkError);
                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed',
                    error: checkError.message
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

    } catch (error) {
        console.error('Rental payment verification error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(error.message)}`);
    }
};

// Hàm thanh toán tiền cọc bằng wallet
const createWalletDepositPayment = async (req, res) => {
    try {
        const { amount, orderInfo, orderCode } = req.body; // orderCode là booking._id
        const userId = req.user._id;

        console.log('Creating wallet deposit payment with data:', {
            amount,
            orderInfo,
            orderCode,
            userId
        });

        // Validate required fields
        if (!amount || !orderInfo || !orderCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: amount, orderInfo, orderCode'
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Kiểm tra booking có còn hợp lệ không
        const bookingStatusCheck = await cancelExpiredBooking(orderCode);
        if (!bookingStatusCheck.success) {
            if (bookingStatusCheck.message === "Booking expired and canceled.") {
                return res.status(400).json({
                    success: false,
                    message: 'Booking has expired and been canceled. Please create a new booking.'
                });
            } else if (bookingStatusCheck.message === "Booking not in pending status.") {
                return res.status(400).json({
                    success: false,
                    message: 'Booking is no longer in pending status and cannot be paid for.'
                });
            } else if (bookingStatusCheck.message === "Booking not found.") {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found for payment.'
                });
            }
        }

        // Kiểm tra ví của user
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ví. Vui lòng nạp tiền vào ví trước.'
            });
        }

        // Kiểm tra số dư ví
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: `Số dư ví không đủ. Hiện tại: ${wallet.balance.toLocaleString('vi-VN')} VND, Cần: ${amount.toLocaleString('vi-VN')} VND`
            });
        }

        // Tạo transaction cho tiền cọc
        const transaction = new Transaction({
            booking: orderCode,
            amount: amount,
            type: 'DEPOSIT',
            status: 'COMPLETED', // Thanh toán ngay lập tức
            paymentMethod: 'WALLET',
            paymentMetadata: {
                orderCode: orderCode,
                paymentMethod: 'WALLET',
                paymentStatus: 'COMPLETED',
                walletId: wallet._id,
                userId: userId
            }
        });
        await transaction.save();

        // Trừ tiền từ ví
        wallet.balance -= amount;
        await wallet.save();

        // Cập nhật booking
        const booking = await Booking.findById(orderCode);
        if (booking) {
            booking.transactions.push(transaction._id);
            booking.status = 'DEPOSIT_PAID';
            await booking.save();
        }

        console.log(`Wallet deposit payment completed: ${amount} VND for booking ${orderCode}`);

        res.json({
            success: true,
            message: 'Thanh toán tiền cọc thành công',
            transactionId: transaction._id,
            bookingId: orderCode,
            amount: amount,
            walletBalance: wallet.balance
        });

    } catch (error) {
        console.error('Error creating wallet deposit payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo thanh toán tiền cọc'
        });
    }
};

// Hàm thanh toán phần còn lại bằng wallet
const createWalletRentalPayment = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        const userId = req.user._id;

        console.log('Creating wallet rental payment with data:', {
            bookingId,
            amount,
            userId
        });

        // Validate required fields
        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bookingId, amount'
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Kiểm tra booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt xe'
            });
        }

        // Kiểm tra trạng thái booking
        if (booking.status !== 'DEPOSIT_PAID') {
            return res.status(400).json({
                success: false,
                message: 'Đơn đặt xe chưa được thanh toán tiền cọc hoặc đã hoàn thành'
            });
        }

        // Kiểm tra ví của user
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ví. Vui lòng nạp tiền vào ví trước.'
            });
        }

        // Kiểm tra số dư ví
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: `Số dư ví không đủ. Hiện tại: ${wallet.balance.toLocaleString('vi-VN')} VND, Cần: ${amount.toLocaleString('vi-VN')} VND`
            });
        }

        // Tạo transaction cho phần còn lại
        const transaction = new Transaction({
            booking: bookingId,
            amount: amount,
            type: 'RENTAL',
            status: 'COMPLETED', // Thanh toán ngay lập tức
            paymentMethod: 'WALLET',
            paymentMetadata: {
                orderCode: bookingId,
                paymentMethod: 'WALLET',
                paymentStatus: 'COMPLETED',
                walletId: wallet._id,
                userId: userId
            }
        });
        await transaction.save();

        // Trừ tiền từ ví
        wallet.balance -= amount;
        await wallet.save();

        // Cập nhật booking
        booking.transactions.push(transaction._id);
        booking.status = 'CONFIRMED';
        await booking.save();

        console.log(`Wallet rental payment completed: ${amount} VND for booking ${bookingId}`);

        res.json({
            success: true,
            message: 'Thanh toán phần còn lại thành công',
            transactionId: transaction._id,
            bookingId: bookingId,
            amount: amount,
            walletBalance: wallet.balance
        });

    } catch (error) {
        console.error('Error creating wallet rental payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo thanh toán phần còn lại'
        });
    }
};

module.exports = {
    createPayment,
    checkPayment,
    handleWebhook,
    verifyMoMoPayment,
    createRentalPayment,
    checkRentalPayment,
    createWalletDepositPayment,
    createWalletRentalPayment,
};