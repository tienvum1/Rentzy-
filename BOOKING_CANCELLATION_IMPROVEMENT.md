# Cải thiện chức năng hủy đặt xe

## Tổng quan
Đã cải thiện chức năng hủy đặt xe trong BookingDetailsPage với thông tin hoàn tiền chi tiết và UX tốt hơn.

## Tính năng mới

### 1. **Kiểm tra điều kiện hủy**
- Kiểm tra thời gian bắt đầu chuyến đi
- Không cho phép hủy đơn đã bắt đầu
- Hiển thị thông báo phù hợp

### 2. **Tính toán hoàn tiền dự kiến**
- **Trạng thái `CONFIRMED`**: Hoàn 100% số tiền đã thanh toán
- **Trạng thái `DEPOSIT_PAID`**: Hoàn tiền cọc theo chính sách
  - > 10 ngày: 100%
  - > 5 ngày: 30%
  - ≤ 5 ngày: 0%
- **Trạng thái `pending`**: Không hoàn tiền

### 3. **Dialog xác nhận thông minh**
- Hiển thị thông tin hoàn tiền dự kiến
- Hiển thị thời gian còn lại
- Giao diện đẹp với styling

### 4. **Thông báo thành công chi tiết**
- Hiển thị từng khoản hoàn tiền
- Hiển thị số dư ví mới
- Tự động chuyển hướng sau 2 giây

### 5. **Button hủy thông minh**
- Chỉ hiển thị khi có thể hủy
- Hiển thị trạng thái phù hợp:
  - ✅ Có thể hủy
  - ❌ Đã hủy
  - ✓ Đã hoàn thành
  - ⏰ Đã bắt đầu

## Code Changes

### 1. **Hàm handleCancelBooking**
```javascript
const handleCancelBooking = async () => {
  // Kiểm tra điều kiện hủy
  const now = new Date();
  const startDate = new Date(booking.startDate);
  
  if (startDate <= now) {
    toast.error('Không thể hủy đơn đã bắt đầu!');
    return;
  }

  // Tính toán số tiền hoàn dự kiến
  let expectedRefund = 0;
  let refundMessage = '';
  
  if (booking.status === 'CONFIRMED') {
    expectedRefund = totalPaid;
    refundMessage = `Sẽ hoàn lại toàn bộ số tiền đã thanh toán: ${formatCurrency(expectedRefund)}`;
  } else if (booking.status === 'DEPOSIT_PAID') {
    // Tính theo chính sách hoàn tiền
  }

  // Hiển thị dialog xác nhận với thông tin chi tiết
  confirmAlert({
    title: 'Xác nhận huỷ đơn đặt xe',
    message: (
      <div>
        <p>Bạn có chắc chắn muốn huỷ đơn đặt xe này không?</p>
        <div style={{ /* styling */ }}>
          <p><strong>Thông tin hoàn tiền:</strong></p>
          <p>{refundMessage}</p>
          <p><strong>Thời gian còn lại:</strong> {daysLeft} ngày</p>
        </div>
      </div>
    ),
    buttons: [
      {
        label: 'Đồng ý hủy',
        onClick: async () => {
          // Gọi API hủy đơn
          // Hiển thị thông báo thành công chi tiết
        }
      },
      {
        label: 'Không hủy',
        onClick: () => toast.info('Đã hủy thao tác')
      }
    ]
  });
};
```

### 2. **Button hủy thông minh**
```javascript
{(() => {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const canCancel = booking.status !== 'canceled' && 
                   booking.status !== 'completed' && 
                   startDate > now;
  
  if (canCancel) {
    return <button className="cancel-booking-button" onClick={handleCancelBooking}>
      <FaTimesCircle /> Huỷ đặt xe
    </button>;
  } else if (booking.status === 'canceled') {
    return <div className="cancel-info">❌ Đơn đã bị hủy</div>;
  } else if (booking.status === 'completed') {
    return <div className="completed-info">✓ Đơn đã hoàn thành</div>;
  } else if (startDate <= now) {
    return <div className="started-info">⏰ Chuyến đi đã bắt đầu</div>;
  }
  return null;
})()}
```

## User Experience

### 1. **Trước khi hủy**
- Hiển thị thông tin hoàn tiền dự kiến
- Hiển thị thời gian còn lại
- Xác nhận rõ ràng

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

## Backend Integration

### API Endpoint
```
POST /api/bookings/:id/cancel-with-refund
```

### Request Body
```json
{
  "reason": "User canceled"
}
```

### Response
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

## Benefits

### 1. **User Experience**
- Thông tin rõ ràng trước khi hủy
- Feedback chi tiết sau khi hủy
- Giao diện thân thiện

### 2. **Transparency**
- Hiển thị chính sách hoàn tiền
- Tính toán dự kiến chính xác
- Thông báo kết quả chi tiết

### 3. **Error Handling**
- Kiểm tra điều kiện trước khi hủy
- Thông báo lỗi rõ ràng
- Log lỗi để debug

### 4. **Maintainability**
- Code có cấu trúc rõ ràng
- Tách biệt logic tính toán
- Dễ dàng mở rộng

## Testing Scenarios

### 1. **Hủy đơn chưa thanh toán**
- Expected: Không hoàn tiền
- UI: Hiển thị "Không hoàn tiền (chưa thanh toán)"

### 2. **Hủy đơn đã thanh toán tiền cọc**
- Expected: Hoàn tiền cọc theo chính sách
- UI: Hiển thị số tiền hoàn dự kiến

### 3. **Hủy đơn đã thanh toán toàn bộ**
- Expected: Hoàn 100% số tiền đã thanh toán
- UI: Hiển thị "Sẽ hoàn lại toàn bộ số tiền"

### 4. **Hủy đơn đã bắt đầu**
- Expected: Không cho phép hủy
- UI: Hiển thị "Không thể hủy đơn đã bắt đầu"

### 5. **Hủy đơn đã hoàn thành**
- Expected: Không hiển thị button hủy
- UI: Hiển thị "✓ Đơn đã hoàn thành" 