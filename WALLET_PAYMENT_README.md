# Quy Trình Thanh Toán Bằng Ví Điện Tử

## Tổng Quan
Hệ thống đã được cập nhật để sử dụng ví điện tử thay vì MoMo cho việc thanh toán đặt chỗ thuê xe. Quy trình này đơn giản hơn và nhanh chóng hơn.

## Quy Trình Thanh Toán

### 1. Thanh Toán Tiền Cọc (Deposit)
- **Endpoint**: `POST /api/payment/wallet/deposit`
- **Quy trình**:
  1. Người dùng tạo booking với trạng thái `pending`
  2. Hệ thống kiểm tra số dư ví
  3. Nếu đủ tiền: trừ tiền từ ví, tạo transaction `DEPOSIT`, cập nhật booking thành `DEPOSIT_PAID`
  4. Nếu không đủ: hiển thị thông báo lỗi và link đến trang nạp tiền

### 2. Thanh Toán Phần Còn Lại (Rental)
- **Endpoint**: `POST /api/payment/wallet/rental`
- **Quy trình**:
  1. Người dùng đã thanh toán tiền cọc (booking status: `DEPOSIT_PAID`)
  2. Hệ thống kiểm tra số dư ví
  3. Nếu đủ tiền: trừ tiền từ ví, tạo transaction `RENTAL`, cập nhật booking thành `CONFIRMED`
  4. Nếu không đủ: hiển thị thông báo lỗi

## Cấu Trúc API

### Wallet Deposit Payment
```javascript
POST /api/payment/wallet/deposit
{
  "amount": 500000,
  "orderInfo": "Thanh toán tiền giữ chỗ cho đơn hàng ABC123",
  "orderCode": "ABC123"
}

Response:
{
  "success": true,
  "message": "Thanh toán tiền cọc thành công",
  "transactionId": "transaction_id",
  "bookingId": "ABC123",
  "amount": 500000,
  "walletBalance": 1500000
}
```

### Wallet Rental Payment
```javascript
POST /api/payment/wallet/rental
{
  "bookingId": "ABC123",
  "amount": 2000000
}

Response:
{
  "success": true,
  "message": "Thanh toán phần còn lại thành công",
  "transactionId": "transaction_id",
  "bookingId": "ABC123",
  "amount": 2000000,
  "walletBalance": 500000
}
```

## Trạng Thái Booking

1. **pending**: Đơn hàng mới tạo, chờ thanh toán tiền cọc
2. **DEPOSIT_PAID**: Đã thanh toán tiền cọc, chờ thanh toán phần còn lại
3. **CONFIRMED**: Đã thanh toán đủ, đơn hàng được xác nhận

## Trạng Thái Transaction

1. **DEPOSIT**: Giao dịch tiền cọc
2. **RENTAL**: Giao dịch tiền thuê xe
3. **COMPLETED**: Giao dịch hoàn thành
4. **FAILED**: Giao dịch thất bại

## Lợi Ích

### So với MoMo:
- ✅ **Nhanh chóng**: Thanh toán ngay lập tức, không cần chờ redirect
- ✅ **Đơn giản**: Không cần tích hợp cổng thanh toán bên ngoài
- ✅ **An toàn**: Tiền được quản lý trong hệ thống nội bộ
- ✅ **Tiết kiệm**: Không mất phí giao dịch MoMo
- ✅ **Trải nghiệm tốt**: Không cần mở tab mới, không cần callback

### Tính năng:
- 🔒 Kiểm tra số dư trước khi thanh toán
- 💰 Hiển thị số dư ví trong giao diện thanh toán
- ⚠️ Cảnh báo khi số dư không đủ
- 🔗 Link nhanh đến trang nạp tiền
- 📊 Cập nhật real-time số dư sau thanh toán

## Frontend Components

### PaymentDeposit.jsx
- Hiển thị thông tin ví
- Kiểm tra số dư đủ/không đủ
- Nút thanh toán bằng ví
- Thông báo lỗi/thành công

### PaymentRemaining.jsx
- Thanh toán phần còn lại bằng ví
- Hiển thị số tiền cần thanh toán
- Nút thanh toán bằng ví

## Backend Controllers

### paymentController.js
- `createWalletDepositPayment()`: Xử lý thanh toán tiền cọc
- `createWalletRentalPayment()`: Xử lý thanh toán phần còn lại

### walletController.js
- `getWallet()`: Lấy thông tin ví
- `createDeposit()`: Nạp tiền vào ví (MoMo)
- `createWithdraw()`: Rút tiền từ ví

## Routes

### Payment Routes
- `POST /api/payment/wallet/deposit`: Thanh toán tiền cọc
- `POST /api/payment/wallet/rental`: Thanh toán phần còn lại

### Wallet Routes
- `GET /api/wallet/info`: Lấy thông tin ví
- `POST /api/wallet/deposit`: Nạp tiền vào ví
- `POST /api/wallet/withdraw`: Rút tiền từ ví

## Bảo Mật

- ✅ Xác thực người dùng qua middleware `protect`
- ✅ Kiểm tra quyền sở hữu ví
- ✅ Validate số tiền và thông tin giao dịch
- ✅ Kiểm tra trạng thái booking hợp lệ
- ✅ Rollback giao dịch khi có lỗi

## Tương Lai

- 🔄 Tích hợp thêm các phương thức nạp tiền khác
- 📱 Push notification khi thanh toán thành công
- 📊 Dashboard thống kê giao dịch
- 🔐 2FA cho giao dịch lớn
- 💳 Tích hợp thẻ tín dụng/ghi nợ 