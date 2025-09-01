# Wallet Deposit API Documentation

## Tổng quan
API này cho phép người dùng nạp tiền vào ví thông qua MoMo payment gateway.

## Endpoints

### 1. POST /api/wallet/deposit
Tạo yêu cầu nạp tiền và redirect đến MoMo payment.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (hoặc cookie session)
```

**Request Body:**
```json
{
  "amount": 50000
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tạo yêu cầu nạp tiền thành công",
  "paymentUrl": "https://test-payment.momo.vn/v2/gateway/api/create",
  "orderId": "WALLET-userId-timestamp",
  "requestId": "MOMOtimestamp"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Số tiền nạp phải từ 10,000 VND trở lên"
}
```

### 2. GET /api/wallet/deposit-callback
Callback từ MoMo sau khi thanh toán (không cần auth).

**Query Parameters:**
- `resultCode`: 0 = success, khác 0 = failed
- `orderId`: ID đơn hàng
- `requestId`: ID request
- `amount`: Số tiền
- `message`: Thông báo

**Response:** Redirect về frontend với status

### 3. POST /api/wallet/deposit-webhook
Webhook từ MoMo (IPN) - không cần auth.

**Request Body:**
```json
{
  "resultCode": "0",
  "orderId": "WALLET-userId-timestamp",
  "requestId": "MOMOtimestamp",
  "amount": "50000",
  "message": "Success"
}
```

**Response:**
```json
{
  "success": true
}
```

## Luồng hoạt động

1. **Frontend gọi API deposit** với số tiền
2. **Backend tạo MoMo payment request** và trả về payment URL
3. **Backend tạo Transaction record** với type 'WALLET_DEPOSIT'
4. **Frontend redirect** user đến MoMo payment page
5. **User thanh toán** trên MoMo
6. **MoMo callback** về backend qua 2 cách:
   - Browser redirect (callback)
   - Server-to-server (webhook)
7. **Backend cập nhật** Transaction status và số dư ví
8. **User được redirect** về frontend với thông báo

## Database Schema

### Wallet Model (Đơn giản)
```javascript
{
  user: ObjectId,
  balance: Number,
  currency: String,
  status: String // active, suspended, closed
}
```

### Transaction Model (Mở rộng)
```javascript
{
  booking: ObjectId, // Optional - cho rental payments
  wallet: ObjectId,  // Optional - cho wallet deposits
  amount: Number,
  type: String, // DEPOSIT, RENTAL, REFUND, WALLET_DEPOSIT, WALLET_WITHDRAW
  status: String, // PENDING, COMPLETED, FAILED, REFUNDED
  paymentMethod: String, // PAYOS, CASH, BANK_TRANSFER, MOMO, WALLET
  paymentMetadata: Map // Lưu thông tin chi tiết của payment
}
```

### Ví dụ Transaction cho Wallet Deposit
```javascript
{
  _id: ObjectId("..."),
  wallet: ObjectId("..."), // ID của ví
  amount: 50000,
  type: "WALLET_DEPOSIT",
  status: "COMPLETED",
  paymentMethod: "MOMO",
  paymentMetadata: {
    requestId: "MOMO1750477575500",
    orderId: "WALLET-userId-timestamp",
    orderInfo: "Nạp tiền vào ví - 50,000 VND",
    paymentMethod: "MOMO",
    paymentStatus: "COMPLETED"
  },
  createdAt: ISODate("2024-01-20T10:30:00.000Z"),
  updatedAt: ISODate("2024-01-20T10:35:00.000Z")
}
```

## Environment Variables

Cần có các biến môi trường sau:
```
BACKEND_URL=http://localhost:4999
FRONTEND_URL=http://localhost:3000
```

## Testing

1. Chạy server backend
2. Đăng nhập và lấy session cookie
3. Gọi API deposit với số tiền hợp lệ
4. Kiểm tra redirect đến MoMo
5. Test callback và webhook
6. Kiểm tra Transaction record được tạo
7. Kiểm tra số dư ví được cập nhật

## Lưu ý

- API sử dụng MoMo test environment
- Minimum amount: 10,000 VND
- Mỗi user chỉ có 1 ví
- **Lịch sử giao dịch được lưu trong Transaction model**
- **Wallet chỉ lưu thông tin cơ bản (balance, status, etc.)**
- Webhook đảm bảo xử lý giao dịch ngay cả khi callback thất bại
- Có thể query lịch sử giao dịch ví bằng: `Transaction.find({ wallet: walletId, type: 'WALLET_DEPOSIT' })` 