const axios = require('axios');

// Test script để gọi API recalculate-refund
async function testRecalculateRefund() {
  try {
    // Thay đổi booking ID này thành ID thực tế của booking có vấn đề
    const bookingId = 'YOUR_BOOKING_ID_HERE'; // Cần thay thế bằng ID thực tế
    const backendUrl = 'http://localhost:4999';
    
    console.log('Testing recalculate refund API...');
    console.log('Booking ID:', bookingId);
    
    // Gọi API recalculate-refund
    const response = await axios.post(
      `${backendUrl}/api/bookings/${bookingId}/recalculate-refund`,
      {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Recalculate thành công!');
      console.log('Tiền hoàn cho renter:', response.data.data.totalRefundForRenterCancel);
      console.log('Tiền bồi thường cho owner:', response.data.data.totalRefundForOwnerCancel);
      console.log('Policy:', response.data.data.policy);
    } else {
      console.log('❌ Recalculate thất bại:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi test API:', error.response?.data || error.message);
  }
}

// Chạy test
testRecalculateRefund();

// Hướng dẫn sử dụng:
// 1. Thay thế YOUR_BOOKING_ID_HERE bằng ID thực tế của booking
// 2. Đảm bảo server backend đang chạy trên port 4999
// 3. Đảm bảo bạn đã đăng nhập (có cookie session)
// 4. Chạy: node test-recalculate-refund.js