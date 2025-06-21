# Cải tiến hệ thống hủy đặt xe với API tích hợp

## Tổng quan
Đã cải tiến toàn bộ hệ thống hủy đặt xe với API backend mới và logic tính toán hoàn tiền chính xác.

## Vấn đề đã khắc phục

### 1. **"Failed to fetch bookings"**
- **Nguyên nhân**: Logic tính toán hoàn tiền không đồng bộ giữa frontend và backend
- **Giải pháp**: Tạo API mới để lấy thông tin hoàn tiền dự kiến từ backend

### 2. **Tính toán hoàn tiền không chính xác**
- **Nguyên nhân**: Frontend tự tính toán thay vì dựa vào backend
- **Giải pháp**: Backend tính toán và trả về kết quả chính xác

## API Endpoints mới

### 1. **GET /api/bookings/:id/expected-refund**
Lấy thông tin hoàn tiền dự kiến khi hủy đơn

#### Request
```http
GET /api/bookings/:id/expected-refund
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "message": "Thông tin hoàn tiền dự kiến",
  "data": {
    "bookingId": "booking_id",
    "bookingStatus": "DEPOSIT_PAID",
    "canCancel": true,
    "daysUntilStart": 15,
    "totalPaid": 500000,
    "reservationFee": 500000,
    "reservationRefund": 500000,
    "remainingRefund": 0,
    "totalRefund": 500000,
    "refundPolicy": {
      "deposit_paid": {
        "over_10_days": "100% tiền cọc",
        "over_5_days": "30% tiền cọc",
        "under_5_days": "0% tiền cọc"
      },
      "confirmed": "100% số tiền đã thanh toán",
      "pending": "0% (chưa thanh toán)"
    }
  }
}
```

### 2. **POST /api/bookings/:id/cancel-with-refund** (Cải tiến)
Hủy đơn và hoàn tiền với logic tính toán chính xác

#### Request
```json
{
  "reason": "User canceled"
}
```

#### Response
```json
{
  "success": true,
  "message": "Đơn đã hủy thành công...",
  "data": {
    "bookingId": "booking_id",
    "reservationRefund": 500000,
    "remainingRefund": 2000000,
    "totalRefund": 2500000,
    "newWalletBalance": 5000000,
    "cancellationReason": "User canceled",
    "cancelledAt": "2025-06-21T04:31:29.415Z"
  }
}
```

## Logic tính toán hoàn tiền (Backend)

### 1. **Hàm getReservationRefund**
```javascript
function getReservationRefund(booking) {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  const reservationFee = booking.reservationFee || 0;

  if (diffDays > 10) return reservationFee; // 100%
  if (diffDays > 5) return reservationFee * 0.3; // 30%
  return 0; // 0%
}
```

### 2. **Hàm getTotalRefund**
```javascript
function getTotalRefund(booking) {
  // Tính tổng số tiền đã thanh toán từ transactions COMPLETED
  const totalPaid = booking.transactions.reduce((sum, t) => {
    if (t.status === 'COMPLETED' && (t.type === 'DEPOSIT' || t.type === 'RENTAL')) {
      return sum + t.amount;
    }
    return sum;
  }, 0);

  // CONFIRMED hoặc RENTAL_PAID: hoàn toàn bộ số tiền đã thanh toán
  if (booking.status === 'CONFIRMED' || booking.status === 'RENTAL_PAID') {
    const reservationRefund = getReservationRefund(booking);
    const remainingRefund = totalPaid - (booking.reservationFee || 0);
    return { reservationRefund, remainingRefund, totalRefund: reservationRefund + remainingRefund };
  }
  
  // DEPOSIT_PAID: chỉ hoàn tiền cọc theo chính sách
  if (booking.status === 'DEPOSIT_PAID' || booking.status === 'deposit_paid') {
    const reservationRefund = getReservationRefund(booking);
    return { reservationRefund, remainingRefund: 0, totalRefund: reservationRefund };
  }
  
  // pending: không hoàn
  if (booking.status === 'pending' || booking.status === 'PENDING') {
    return { reservationRefund: 0, remainingRefund: 0, totalRefund: 0 };
  }
  
  return { reservationRefund: 0, remainingRefund: 0, totalRefund: 0 };
}
```

## Frontend Integration

### 1. **Hàm handleCancelBooking cải tiến**
```javascript
const handleCancelBooking = async () => {
  try {
    // 1. Lấy thông tin hoàn tiền dự kiến từ backend
    const refundRes = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/expected-refund`, 
      { withCredentials: true }
    );

    if (!refundRes.data.success) {
      toast.error(refundRes.data.message);
      return;
    }

    const { canCancel, daysUntilStart, totalPaid, reservationRefund, remainingRefund, totalRefund, refundPolicy } = refundRes.data.data;

    if (!canCancel) {
      toast.error('Không thể hủy đơn đã bắt đầu!');
      return;
    }

    // 2. Hiển thị dialog xác nhận với thông tin chi tiết
    confirmAlert({
      title: 'Xác nhận huỷ đơn đặt xe',
      message: (
        <div>
          <p>Bạn có chắc chắn muốn huỷ đơn đặt xe này không?</p>
          <div style={{ /* styling */ }}>
            <p><strong>Thông tin hoàn tiền:</strong></p>
            <p>{refundMessage}</p>
            <p><strong>Tổng hoàn:</strong> {formatCurrency(totalRefund)}</p>
            <p><strong>Thời gian còn lại:</strong> {daysUntilStart} ngày</p>
            <p><strong>Chính sách hoàn tiền:</strong></p>
            {/* Hiển thị chính sách */}
          </div>
        </div>
      ),
      buttons: [
        {
          label: 'Đồng ý hủy',
          onClick: async () => {
            // 3. Gọi API hủy đơn
            const cancelRes = await axios.post(
              `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/cancel-with-refund`, 
              { reason: 'User canceled' }, 
              { withCredentials: true }
            );

            if (cancelRes.data.success) {
              // 4. Hiển thị kết quả thành công
              const { reservationRefund: actualReservationRefund, remainingRefund: actualRemainingRefund, totalRefund: actualTotalRefund, newWalletBalance } = cancelRes.data.data;
              
              let successMessage = 'Hủy đơn thành công!\n';
              if (actualReservationRefund > 0) {
                successMessage += `• Hoàn tiền cọc: ${formatCurrency(actualReservationRefund)}\n`;
              }
              if (actualRemainingRefund > 0) {
                successMessage += `• Hoàn phần còn lại: ${formatCurrency(actualRemainingRefund)}\n`;
              }
              successMessage += `• Tổng hoàn: ${formatCurrency(actualTotalRefund)}\n`;
              successMessage += `• Số dư ví mới: ${formatCurrency(newWalletBalance)}`;

              toast.success(successMessage);
              
              // Chuyển hướng sau 2 giây
              setTimeout(() => {
                navigate('/profile/my-bookings');
              }, 2000);
            }
          }
        }
      ]
    });

  } catch (err) {
    console.error('Error:', err);
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
  }
};
```

## Chính sách hoàn tiền

### 1. **Tiền cọc (DEPOSIT_PAID)**
- **> 10 ngày**: Hoàn 100% tiền cọc
- **> 5 ngày**: Hoàn 30% tiền cọc  
- **≤ 5 ngày**: Không hoàn tiền

### 2. **Đã thanh toán toàn bộ (CONFIRMED/RENTAL_PAID)**
- **Tiền cọc**: Hoàn theo chính sách trên
- **Phần còn lại**: Hoàn 100%

### 3. **Chưa thanh toán (pending)**
- Không hoàn tiền

## User Experience Flow

### 1. **Trước khi hủy**
- Hiển thị thông tin hoàn tiền dự kiến chính xác
- Hiển thị chính sách hoàn tiền
- Hiển thị thời gian còn lại
- Hiển thị số tiền đã thanh toán

### 2. **Trong quá trình hủy**
- Loading indicator
- Thông báo "Đang xử lý hủy đơn..."

### 3. **Sau khi hủy thành công**
- Thông báo chi tiết từng khoản hoàn tiền
- Hiển thị số dư ví mới
- Tự động chuyển hướng

### 4. **Xử lý lỗi**
- Thông báo lỗi chi tiết
- Log lỗi để debug

## Benefits

### 1. **Accuracy**
- Tính toán hoàn tiền chính xác từ backend
- Đồng bộ logic giữa frontend và backend
- Tránh sai lệch thông tin

### 2. **Transparency**
- Hiển thị chính sách hoàn tiền rõ ràng
- Thông tin chi tiết trước khi hủy
- Kết quả thực tế sau khi hủy

### 3. **User Experience**
- Thông tin minh bạch
- Feedback chi tiết
- Giao diện thân thiện

### 4. **Maintainability**
- Logic tập trung ở backend
- API tái sử dụng
- Dễ dàng cập nhật chính sách

## Testing Scenarios

### 1. **Hủy đơn chưa thanh toán**
- Expected: Không hoàn tiền
- API: `totalRefund = 0`

### 2. **Hủy đơn đã thanh toán tiền cọc (> 10 ngày)**
- Expected: Hoàn 100% tiền cọc
- API: `reservationRefund = reservationFee`

### 3. **Hủy đơn đã thanh toán tiền cọc (> 5 ngày)**
- Expected: Hoàn 30% tiền cọc
- API: `reservationRefund = reservationFee * 0.3`

### 4. **Hủy đơn đã thanh toán tiền cọc (≤ 5 ngày)**
- Expected: Không hoàn tiền
- API: `reservationRefund = 0`

### 5. **Hủy đơn đã thanh toán toàn bộ**
- Expected: Hoàn 100% số tiền đã thanh toán
- API: `totalRefund = totalPaid`

### 6. **Hủy đơn đã bắt đầu**
- Expected: Không cho phép hủy
- API: `canCancel = false`

## Error Handling

### 1. **Network Errors**
- Retry mechanism
- User-friendly error messages
- Fallback options

### 2. **API Errors**
- Detailed error messages
- Proper HTTP status codes
- Logging for debugging

### 3. **Validation Errors**
- Input validation
- Business rule validation
- Clear error feedback

## Future Improvements

### 1. **Real-time Updates**
- WebSocket for real-time booking status
- Live wallet balance updates

### 2. **Advanced Refund Policies**
- Dynamic refund rates
- Special event policies
- User tier-based policies

### 3. **Analytics**
- Cancellation analytics
- Refund tracking
- User behavior insights 