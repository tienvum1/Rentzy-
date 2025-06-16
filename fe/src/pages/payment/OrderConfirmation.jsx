import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUser, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaCheck, FaCar, FaCircle } from 'react-icons/fa';
import axios from 'axios';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  // Constants
  const HOLD_FEE = 500000; // Tiền giữ chỗ
  const DELIVERY_FEE = 200000; // Phí giao xe 2 chiều

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get('http://localhost:4999/api/bookings/685012c80e65ce87382b86d1', {
          withCredentials: true
        });
        
        if (response.data.success) {
          setBooking(response.data.booking);
          if (response.data.booking.renter) {
            setFormData({
              name: response.data.booking.renter.name || '',
              phone: response.data.booking.renter.phone || ''
            });
          }
        }
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng');
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Tính toán các khoản phí
  const calculateFees = () => {
    if (!booking) return null;

    const totalCost = booking.totalAmount; // Tiền thuê xe cơ bản (rentalFee + deliveryFee - discountAmount)
    const deliveryFee = booking.pickupLocation !== booking.vehicle?.location ? DELIVERY_FEE : 0;
    const discountAmount = booking.discountAmount || 0;
    const deposit = booking.vehicle?.deposit || 0;
    const holdFee = HOLD_FEE;

    // totalAmount là tiền thuê xe cơ bản (giống như bookingDetails.finalAmount trong VehicleBookingSection)
    const totalAmount = totalCost;

    return {
      totalCost,
      deliveryFee,
      discountAmount,
      deposit,
      holdFee,
      totalAmount
    };
  };

  const fees = calculateFees();

  const handleConfirm = async () => {
    try {
      const response = await axios.post('http://localhost:4999/api/bookings/confirm', {
        bookingId: booking._id,
        name: formData.name,
        phone: formData.phone,
        totalCost: fees.totalCost,
        deliveryFee: fees.deliveryFee,
        holdFee: fees.holdFee,
        deposit: fees.deposit,
        discountAmount: fees.discountAmount,
        totalAmount: fees.totalAmount
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Handle successful confirmation
        console.log('Booking confirmed:', response.data);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải thông tin...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!booking || !fees) {
    return <div className="error">Không tìm thấy thông tin đơn hàng</div>;
  }

  return (
    <div className="order-confirmation-container">
      <div className="order-card">
        <div className="back-link">
          <FaArrowLeft className="mr-2" />
          <span className="font-semibold">Quay lại</span>
        </div>

        <div className="progress-steps">
          <div className="progress-step">
            <div className="step-icon active">
              <FaCheck />
            </div>
            <span className="step-text">Tìm và chọn xe</span>
          </div>
          <div className="progress-divider"></div>
          <div className="progress-step">
            <div className="step-icon current">
              <FaCar />
            </div>
            <span className="step-text">Xác nhận đơn hàng</span>
          </div>
          <div className="progress-divider"></div>
          <div className="progress-step">
            <div className="step-icon inactive">
              <FaCircle />
            </div>
            <span className="step-text">Thanh toán giữ chỗ</span>
          </div>
          <div className="progress-divider"></div>
          <div className="progress-step">
            <div className="step-icon inactive">
              <FaCircle />
            </div>
            <span className="step-text">Tải app & lấy xe</span>
          </div>
        </div>

        <h2 className="section-title text-center">Thông tin liên hệ</h2>
        <p className="info-text">Vui lòng để lại thông tin liên lạc. Chúng tôi sẽ liên hệ bạn sớm nhất</p>

        <div className="input-grid">
          <div className="input-field">
            <FaUser />
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên" 
            />
          </div>
          <div className="input-field">
            <FaPhone />
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại" 
            />
          </div>
        </div>

        <h2 className="section-title">Thông tin đơn hàng</h2>

        <div className="order-details-section">
          <div className="order-detail-item">
            <FaCalendarAlt />
            <div>
              <p className="detail-label">Thời gian thuê</p>
              <p className="detail-value">
                {formatDate(booking.startDate)} đến {formatDate(booking.endDate)}
              </p>
            </div>
          </div>
          <div className="order-detail-item">
            <FaMapMarkerAlt />
            <div>
              <p className="detail-label">Nhận xe tại vị trí của xe</p>
              <p className="detail-value">{booking.pickupLocation}</p>
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-item">
              <span className="summary-label">Phí thuê xe <span className="info-icon">(i)</span></span>
              <span className="summary-value">{formatCurrency(fees.totalCost)}</span>
            </div>
            {fees.deliveryFee > 0 && (
              <div className="summary-item">
                <span className="summary-label">Phí giao xe (2 chiều)</span>
                <span className="summary-value">{formatCurrency(fees.deliveryFee)}</span>
              </div>
            )}
            <div className="summary-item">
              <span className="summary-label">Tiền đặt cọc</span>
              <span className="summary-value">{formatCurrency(fees.deposit)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tiền giữ chỗ</span>
              <span className="summary-value">{formatCurrency(fees.holdFee)}</span>
            </div>
            {fees.discountAmount > 0 && (
              <div className="summary-item">
                <span className="summary-label">Giảm giá</span>
                <span className="summary-value discount">-{formatCurrency(fees.discountAmount)}</span>
              </div>
            )}
            <div className="total-summary">
              <span>Tổng cộng</span>
              <span>{formatCurrency(fees.totalAmount)}</span>
            </div>
          </div>
        </div>

        <h2 className="section-title">Các bước thanh toán</h2>

        <div className="payment-steps-section">
          <div className="payment-step">
            <div className="payment-step-number">
              1
            </div>
            <div className="payment-step-content">
              <p className="payment-step-title">Thanh toán giữ chỗ qua BonbonCar</p>
              <p className="payment-step-description">Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào tiền thế chấp khi nhận xe</p>
            </div>
            <span className="payment-amount">{formatCurrency(fees.holdFee)}</span>
          </div>
          <div className="payment-step">
            <div className="payment-step-number inactive">
              2
            </div>
            <div className="payment-step-content">
              <p className="payment-step-title">Thanh toán khi nhận xe</p>
              <div className="payment-sub-details">
                <p className="payment-amount">{formatCurrency(fees.totalCost + fees.deliveryFee - fees.discountAmount + fees.deposit)}</p>
                <p>Tiền thuê <span>{formatCurrency(fees.totalCost + fees.deliveryFee - fees.discountAmount)}</span></p>
                <p>Tiền thế chấp <span>{formatCurrency(fees.deposit)}</span></p>
                <p>Sẽ hoàn lại khi trả xe</p>
              </div>
            </div>
          </div>
        </div>

        <div className="vat-checkbox-container">
          <input type="checkbox" id="vat" />
          <label htmlFor="vat">Xuất hoá đơn VAT</label>
        </div>

        <button className="confirm-button" onClick={handleConfirm}>
          Xác nhận
        </button>

        <p className="terms-text">
          Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation; 