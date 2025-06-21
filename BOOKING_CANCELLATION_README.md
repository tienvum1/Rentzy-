# Booking Cancellation with Refund System

## Tổng quan
Hệ thống hủy đặt xe với hoàn tiền tự động về ví người dùng, bao gồm việc tạo transaction và cập nhật số dư ví.

## API Endpoint

### Hủy đặt xe với hoàn tiền
**POST** `/api/bookings/:id/cancel-with-refund`

#### Request Body:
```json
{
  "reason": "User canceled" // Lý do hủy (optional)
}
```

#### Response:
```json
{
  "success": true,
  "message": "Đơn đã hủy thành công. Số tiền hoàn giữ chỗ: 500,000 VND, hoàn phần còn lại: 2,000,000 VND, tổng hoàn: 2,500,000 VND",
  "data": {
    "bookingId": "68563597e367a7afdb392743",
    "reservationRefund": 500000,
    "remainingRefund": 2000000,
    "totalRefund": 2500000,
    "newWalletBalance": 5000000,
    "cancellationReason": "User canceled",
    "cancelledAt": "2025-06-21T04:31:29.415Z"
  }
}
```

## Logic Hoàn Tiền

### 1. Trạng thái Booking có thể hủy:
- `pending`: Chưa thanh toán
- `DEPOSIT_PAID`: Đã thanh toán tiền cọc
- `CONFIRMED`: Đã thanh toán toàn bộ

### 2. Chính sách hoàn tiền:

#### Trạng thái `pending`:
- **Hoàn tiền**: 0 VND
- **Lý do**: Chưa thanh toán gì

#### Trạng thái `DEPOSIT_PAID`:
- **Hoàn tiền**: Tiền cọc theo chính sách
- **Chính sách tiền cọc**:
  - > 10 ngày trước ngày thuê: 100%
  - > 5 ngày trước ngày thuê: 30%
  - ≤ 5 ngày trước ngày thuê: 0%

#### Trạng thái `CONFIRMED`:
- **Hoàn tiền**: Tiền cọc theo chính sách + 100% phần còn lại
- **Ví dụ**: 
  - Tổng thanh toán: 3,000,000 VND
  - Tiền cọc: 500,000 VND (hoàn 100% = 500,000 VND)
  - Phần còn lại: 2,500,000 VND (hoàn 100% = 2,500,000 VND)
  - **Tổng hoàn**: 3,000,000 VND

### 3. Điều kiện hủy:
- Chỉ người thuê hoặc admin mới được hủy
- Chưa bắt đầu chuyến đi (startDate > hiện tại)
- Booking ở trạng thái cho phép hủy

## Transaction Records

### 1. Transaction hoàn tiền cọc:
```json
{
  "_id": "transaction_id_1",
  "booking": "booking_id",
  "amount": 500000,
  "type": "REFUND",
  "status": "COMPLETED",
  "paymentMethod": "WALLET",
  "paymentMetadata": {
    "reason": "Refund reservation fee on cancel",
    "originalBookingId": "booking_id",
    "cancellationReason": "User canceled",
    "refundType": "RESERVATION_FEE"
  }
}
```

### 2. Transaction hoàn phần còn lại:
```json
{
  "_id": "transaction_id_2",
  "booking": "booking_id",
  "amount": 2000000,
  "type": "REFUND",
  "status": "COMPLETED",
  "paymentMethod": "WALLET",
  "paymentMetadata": {
    "reason": "Refund remaining payment on cancel",
    "originalBookingId": "booking_id",
    "cancellationReason": "User canceled",
    "refundType": "REMAINING_PAYMENT"
  }
}
```

## Database Updates

### 1. Booking:
- `status`: `canceled`
- `cancellationReason`: Lý do hủy
- `cancelledAt`: Thời gian hủy
- `cancelledBy`: `renter`
- `transactions`: Thêm ID của các transaction hoàn tiền

### 2. Wallet:
- `balance`: Cộng thêm số tiền hoàn

### 3. Transaction:
- Tạo 1-2 transaction mới (tùy theo loại hoàn tiền)

## Tính năng Bảo mật

### 1. Database Transaction:
- Sử dụng MongoDB session để đảm bảo tính nhất quán
- Rollback nếu có lỗi xảy ra

### 2. Authorization:
- Chỉ người thuê hoặc admin mới được hủy
- Kiểm tra quyền truy cập

### 3. Validation:
- Kiểm tra trạng thái booking
- Kiểm tra thời gian bắt đầu chuyến đi
- Kiểm tra ví người dùng tồn tại

## Frontend Integration

### 1. Button hủy:
- Hiển thị cho transaction type `RENTAL`
- Confirmation dialog trước khi hủy
- Refresh page sau khi hủy thành công

### 2. Error Handling:
- Hiển thị thông báo lỗi chi tiết
- Log lỗi để debug

## Usage Examples

### Hủy booking chưa thanh toán:
```bash
POST /api/bookings/booking_id/cancel-with-refund
# Response: Không hoàn tiền
```

### Hủy booking đã thanh toán tiền cọc:
```bash
POST /api/bookings/booking_id/cancel-with-refund
# Response: Hoàn tiền cọc theo chính sách
```

### Hủy booking đã thanh toán toàn bộ:
```bash
POST /api/bookings/booking_id/cancel-with-refund
# Response: Hoàn toàn bộ số tiền đã thanh toán
```

## Monitoring & Logging

### 1. Console Logs:
- Log khi hủy booking thành công
- Log số tiền hoàn
- Log lỗi nếu có

### 2. Transaction History:
- Tất cả giao dịch hoàn tiền được lưu trong database
- Có thể tra cứu lịch sử hoàn tiền

### 3. Audit Trail:
- Lưu thông tin người hủy
- Lưu thời gian hủy
- Lưu lý do hủy 