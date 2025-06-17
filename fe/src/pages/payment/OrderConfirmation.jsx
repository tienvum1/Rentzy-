import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUser, FaPhone,FaRegCircle, FaCalendarAlt, FaMapMarkerAlt, FaCheck, FaCar, FaCircle } from 'react-icons/fa';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './OrderConfirmation.css';
import Header from '../../components/Header/Header';

const OrderConfirmation = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [paymentStatus, setPaymentStatus] = useState('UNKNOWN'); // PENDING, COMPLETED, FAILED, CANCELED

  // Constants
  const HOLD_FEE = 500000; // Tiền giữ chỗ
  const DELIVERY_FEE = 200000; // Phí giao xe 2 chiều

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const config = {
          withCredentials: true, // Đảm bảo gửi kèm cookie xác thực
        };
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}`, config);
        setBooking(res.data.booking);
        setLoading(false);

        // Determine payment status from transactions
        const depositTransaction = res.data.booking.transactions.find(
          t => t.type === 'DEPOSIT' && t.paymentMethod === 'MOMO'
        );

        if (depositTransaction) {
          setPaymentStatus(depositTransaction.status);
        } else {
          setPaymentStatus('NO_DEPOSIT_FOUND');
        }

      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, navigate]);

  // Add back button handler
  const handleBack = () => {
    navigate(-1);
  };

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

    const totalCost = booking.totalCost; // Tiền thuê xe cơ bản
    const deliveryFee = booking.pickupLocation !== booking.vehicle?.location ? DELIVERY_FEE : 0;
    const discountAmount = booking.discountAmount || 0;
    const deposit = booking.deposit || 0;
    const holdFee = booking.reservationFee || HOLD_FEE;

    // Tổng tiền sau khi trừ giảm giá
    const totalAmount = booking.totalAmount;

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
    // Directly navigate to the payment page
    if (booking && booking._id) {
      navigate(`/payment-deposit/${booking._id}`);
    } else {
      console.error('Booking ID not available for navigation.');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const isPaymentCompleted = paymentStatus === 'COMPLETED';
  const isPaymentFailedOrCanceled = paymentStatus === 'FAILED' || paymentStatus === 'CANCELED';

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
    <><Header/>
    <div className="order-confirmation-container">
      <div className="order-card">
        <div className="back-link" onClick={handleBack}>
          <FaArrowLeft className="mr-2" />
          <span className="font-semibold">Quay lại</span>
        </div>

        <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Tìm và chọn xe</span>
            </div>
            <div className="progress-divider completed"></div>
            <div className={`progress-step completed ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Xác nhận đơn hàng</span>
            </div>
            <div className={`progress-divider ${isPaymentCompleted ? 'completed' : ''}`}></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-icon">
                <FaCar />
              </div>
              <span className="step-text">Thanh toán giữ chỗ</span>
            </div>
            <div className={`progress-divider ${isPaymentCompleted ? 'completed' : ''}`}></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : ''}`}>
              <div className="step-icon">
                <FaRegCircle />
              </div>
              <span className="step-text">Tải app & lấy xe</span>
            </div>
          </div>

        <h2 className="section-title text-center">
            {isPaymentCompleted ? 'Thanh toán giữ chỗ thành công!' : isPaymentFailedOrCanceled ? 'Thanh toán thất bại hoặc đã hủy.' : 'Đang chờ xác nhận thanh toán...'}
        </h2>
        {isPaymentCompleted && (
            <div className="payment-success-message text-center">
                <p>Mã đơn hàng của bạn: <strong>{booking._id}</strong></p>
                <p>Cảm ơn bạn đã thanh toán thành công. Đơn hàng của bạn đang chờ chủ xe xác nhận.</p>
            </div>
        )}

        {!isPaymentCompleted && (
            <div className="input-grid">
                <div className="input-field">
                    <FaUser />
                    <span className="display-field">{booking.renter.name || 'Chưa có thông tin tên'}</span>
                </div>
                <div className="input-field">
                    <FaPhone />
                    <span className="display-field">{booking.renter.phone || 'Chưa có thông tin số điện thoại'}</span>
                </div>
            </div>
        )}

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
              <p className="detail-label">Địa điểm nhận xe</p>
              <p className="detail-value">{booking.pickupLocation}</p>
            </div>
          </div>
          <div className="order-detail-item">
            <FaMapMarkerAlt />
            <div>
              <p className="detail-label">Địa điểm trả xe</p>
              <p className="detail-value">{booking.returnLocation}</p>
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-item">
              <span className="summary-label">Phí thuê xe </span>
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
              <p className="payment-step-title">Thanh toán giữ chỗ qua Rentzy</p>
              <p className="payment-step-description">Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào số tiền còn lại phải thanh toán khi nhận xe.</p>
            </div>
            <span className="payment-amount">{formatCurrency(fees.holdFee)}</span>
          </div>
          <div className="payment-step">
            <div className={`payment-step-number ${isPaymentCompleted ? 'completed' : ''}`}>
              2
            </div>
            <div className="payment-step-content">
              <p className="payment-step-title">Thanh toán số tiền còn lại khi nhận xe</p>
              <p className="payment-step-description">Số tiền còn lại <span>{formatCurrency(fees.totalAmount - fees.holdFee)}</span></p>
              <p className="payment-step-description">Tiền cọc xe sẽ được thanh toán sau khi hoàn thành chuyến đi <span>{formatCurrency(fees.deposit)}</span></p>
            </div>
            <span className="payment-amount">{formatCurrency(fees.totalAmount - fees.holdFee)}</span>
          </div>
        </div>

        <div className="action-buttons">
            {!isPaymentCompleted && (
                <button className="confirm-button" onClick={handleConfirm}>
                    Đi đến thanh toán giữ chỗ
                </button>
            )}
        </div>

        <p className="terms-text">
          Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a>
        </p>

        <button className="back-to-home-button" onClick={handleBackToHome}>
          Quay về trang chủ
        </button>
      </div>
    </div>
    </>
  );
};

export default OrderConfirmation; 