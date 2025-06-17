import React, { useState, useEffect } from 'react';
import { FaCheck, FaCar, FaRegCircle } from 'react-icons/fa';
import { MdContentCopy } from "react-icons/md";
import './PaymentDeposit.css';
import Header from '../../components/Header/Header';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentDeposit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);
  const [remainingAmountToPay, setRemainingAmountToPay] = useState(0);

  // Calculate fees based on booking data
  const calculateFees = () => {
    if (!booking) return null;
    
    const totalCost = booking.totalCost; // Phí thuê xe cơ bản
    const deliveryFee = booking.isDelivery ? 200000 : 0; // Phí giao xe nếu có
    const discountAmount = booking.discountAmount || 0; // Tiền giảm giá
    const deposit = booking.deposit || 0; // Tiền cọc
    const holdFee = booking.reservationFee || 500000; // Tiền giữ chỗ

    // Tổng số tiền sau khi trừ giảm giá và trừ tiền giữ chỗ
    const totalAmountAfterDiscount = totalCost + deliveryFee - discountAmount;
    const remainingAmount = totalAmountAfterDiscount - holdFee;

    return {
      totalCost,
      deliveryFee,
      discountAmount,
      deposit,
      holdFee,
      totalAmount: totalAmountAfterDiscount,
      remainingAmount
    };
  };

  const fees = calculateFees();

  React.useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const config = {
          withCredentials: true, 
        };
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}`, config);
        const fetchedBooking = res.data.booking;
        setBooking(fetchedBooking);
        setLoading(false);

        // Calculate total amount already paid from COMPLETED transactions
        const totalPaid = fetchedBooking.transactions.reduce((sum, trans) => {
            if (trans.status === 'COMPLETED') {
                return sum + trans.amount;
            }
            return sum;
        }, 0);

        const amountNeededForDeposit = fetchedBooking.reservationFee;
        const currentRemainingAmount = fetchedBooking.totalAmount - totalPaid;
        setRemainingAmountToPay(currentRemainingAmount);

        // Determine payment status based on transactions and URL query params
        const queryParams = new URLSearchParams(location.search);
        const resultCode = queryParams.get('resultCode');
        const message = queryParams.get('message');

        if (resultCode) {
          if (resultCode === '0') {
            setPaymentStatus('COMPLETED');
            setIsPaymentInitiated(true);
            toast.success('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.');
            setTimeout(() => {
              navigate(`/confirm/${bookingId}`);
            }, 2000);
          } else {
            setPaymentStatus('FAILED');
            setIsPaymentInitiated(true);
            toast.error(`Thanh toán thất bại: ${message || 'Có lỗi xảy ra trong quá trình thanh toán'}`);
          }
        } else {
            // Check deposit status first
            const depositTransaction = fetchedBooking.transactions.find(
                t => t.type === 'DEPOSIT' && t.paymentMethod === 'MOMO'
            );
            if (depositTransaction && depositTransaction.status === 'COMPLETED') {
                if (fetchedBooking.status === 'DEPOSIT_PAID' && currentRemainingAmount > 0) {
                    setPaymentStatus('DEPOSIT_PAID'); // Chỉ mới trả tiền giữ chỗ
                } else if (fetchedBooking.status === 'CONFIRMED' || fetchedBooking.status === 'IN_PROGRESS') {
                    setPaymentStatus('COMPLETED'); // Đã trả đủ tiền
                } else {
                    setPaymentStatus(depositTransaction.status);
                }
            } else if (depositTransaction && depositTransaction.status === 'PENDING') {
                setPaymentStatus('PENDING');
            } else if (depositTransaction && depositTransaction.status === 'FAILED') {
                setPaymentStatus('FAILED');
            } else {
                setPaymentStatus('NO_DEPOSIT_FOUND');
            }
            setIsPaymentInitiated(false);
        }

        // Start countdown only if booking is pending deposit payment
        if (fetchedBooking.status === 'pending') {
            setIsPaymentInitiated(true); // Indicate that payment is expected
            const createdAt = new Date(fetchedBooking.createdAt).getTime();
            const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
            const expirationTime = createdAt + tenMinutes;
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expirationTime - now) / 1000));
            setCountdown(timeLeft);

            if (timeLeft <= 0) {
                setIsTimeUp(true);
            }
        } else {
            // If not pending, stop countdown and remove initiation flag
            setCountdown(0);
            setIsTimeUp(false);
            setIsPaymentInitiated(false);
        }

      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Vui lòng đăng nhập để xem thông tin thanh toán.");
          navigate('/login');
        }
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate, location.search]);

  const handleInitialPayment = async () => {
    if (!booking) return;
    setIsPaymentInitiated(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/momo/create`,
        {
          amount: booking.reservationFee,
          orderInfo: `Thanh toán tiền giữ chỗ cho đơn hàng ${booking._id}`,
          orderCode: booking._id,
        },
        {
          withCredentials: true,
        }
      );
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl; // Redirect to MoMo payment page
      } else {
        toast.error("Không thể tạo liên kết thanh toán.");
        setIsPaymentInitiated(false);
      }
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi yêu cầu thanh toán tiền giữ chỗ.");
      setIsPaymentInitiated(false);
    }
  };

  const handleRemainingPayment = async () => {
    if (!booking || remainingAmountToPay <= 0) return;
    setIsPaymentInitiated(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/momo/rental-payment`,
        {
          bookingId: booking._id,
        },
        {
          withCredentials: true,
        }
      );
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl; // Redirect to MoMo payment page
      } else {
        toast.error("Không thể tạo liên kết thanh toán phần còn lại.");
        setIsPaymentInitiated(false);
      }
    } catch (error) {
      console.error("Remaining payment initiation failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi yêu cầu thanh toán phần còn lại.");
      setIsPaymentInitiated(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isPaymentCompleted = paymentStatus === 'COMPLETED' || paymentStatus === 'DEPOSIT_PAID';
  const isPaymentFailedOrCanceled = paymentStatus === 'FAILED' || paymentStatus === 'CANCELED';

  if (loading) {
    return <Header><div className="loading-screen">Đang tải thông tin...</div></Header>;
  }

  if (error) {
    return <Header><div className="error-screen">Lỗi: {error}</div></Header>;
  }

  if (!booking) {
    return <Header><div className="error-screen">Không tìm thấy thông tin đơn hàng.</div></Header>;
  }

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="reservation-payment-container">
        <div className="progress-bar-wrapper">
          <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Tìm và chọn xe</span>
            </div>
            <div className="progress-divider completed"></div>
            <div className="progress-step completed">
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Xác nhận đơn hàng</span>
            </div>
            <div className="progress-divider current"></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-icon">
                <FaCar />
              </div>
              <span className="step-text">Thanh toán giữ chỗ</span>
            </div>
            <div className={`progress-divider ${isPaymentCompleted ? 'completed' : ''}`}></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : ''}`}>
              <div className="step-icon inactive">
                <FaRegCircle />
              </div>
              <span className="step-text">Nhận xe</span>
            </div>
          </div>
        </div>

        <div className="content-wrapper">
          <div className="payment-details-section">
            {isPaymentCompleted && (
              <div className="payment-success-message text-center">
                <p>Thanh toán giữ chỗ thành công!</p>
                <p>Mã đơn hàng của bạn: <strong>{booking._id}</strong></p>
                <p>Đơn hàng của bạn đang chờ chủ xe xác nhận.</p>
                <button onClick={() => navigate('/bookings')} className="confirm-button">Xem Đơn Hàng Của Tôi</button>
                <button onClick={() => navigate('/')} className="back-to-home-button">Về Trang Chủ</button>
              </div>
            )}

            {isPaymentFailedOrCanceled && (
              <div className="payment-fail-message text-center">
                <p>Thanh toán giữ chỗ thất bại hoặc đã bị hủy.</p>
                <p>Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần.</p>
                <button onClick={handleInitialPayment} className="confirm-button">Thử lại thanh toán</button>
                <button onClick={() => navigate('/')} className="back-to-home-button">Về Trang Chủ</button>
              </div>
            )}

            {!isPaymentCompleted && !isPaymentFailedOrCanceled && !isTimeUp && !isPaymentInitiated && (
              <div className="initial-payment-prompt text-center">
                <h2 className="section-title">Xác nhận thanh toán giữ chỗ</h2>
                <p>Vui lòng xác nhận để bắt đầu quá trình thanh toán giữ chỗ và kích hoạt bộ đếm thời gian.</p>
                <p className="deposit-amount">Số tiền giữ chỗ: {formatCurrency(fees.holdFee)}</p>
                <button 
                  className="confirm-button"
                  onClick={() => setIsPaymentInitiated(true)}
                >
                  Xác nhận và Tiếp tục thanh toán
                </button>
              </div>
            )}

            {!isPaymentCompleted && !isPaymentFailedOrCanceled && !isTimeUp && isPaymentInitiated && (
              <div className="payment-pending-ui">
                <h2 className="section-title">Thanh toán phí giữ chỗ</h2>
                <p className="deposit-amount">{formatCurrency(fees.holdFee)}</p>
                <p className="time-left-label">Thời gian giữ chỗ còn lại</p>
                <div className="countdown-timer">{formatTime(countdown)}</div>
                <p className="order-code-label">Mã đặt xe của bạn <span className="order-code">{booking._id}</span></p>
                <div className="momo-payment-section">
                  <h3 className="section-subtitle">Thanh toán bằng MoMo</h3>
                  <p className="momo-instruction">Nhấn nút bên dưới để thanh toán giữ chỗ qua cổng MoMo.</p>
                  <button 
                    className="momo-pay-button" 
                    onClick={handleInitialPayment} 
                    disabled={isPaying || isTimeUp}
                  >
                    {isPaying ? 'Đang xử lý...' : isTimeUp ? 'Đã hết thời gian thanh toán' : 'Thanh toán qua MoMo'}
                  </button>
                </div>
              </div>
            )}

            {isTimeUp && !isPaymentCompleted && !isPaymentFailedOrCanceled && (
              <div className="payment-expired-message text-center">
                <p>Thời gian thanh toán đã hết hạn.</p>
                <p>Đơn đặt xe của bạn đã bị hủy.</p>
                <button onClick={() => navigate('/')} className="confirm-button">Về Trang Chủ</button>
              </div>
            )}

          </div>

          <div className="order-summary-section">
            <h2 className="section-title">Thông tin đơn thuê</h2>
            <div className="car-image-container">
              <img src={booking.vehicle?.primaryImage || "/images/car-placeholder.png"} alt="Car" className="car-image" />
            </div>
            <div className="order-details-info">
              <div className="detail-row">
                <span>Mã đặt xe</span>
                <span className="detail-value">{booking._id}</span>
              </div>
              <div className="detail-row">
                <span>Tên khách thuê</span>
                <span className="detail-value">{booking.renter?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Số điện thoại</span>
                <span className="detail-value">{booking.renter?.phone || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Ngày nhận:</span>
                <span className="detail-value">{formatDate(booking.startDate)} {booking.pickupTime}</span>
              </div>
              <div className="detail-row">
                <span>Ngày trả:</span>
                <span className="detail-value">{formatDate(booking.endDate)} {booking.returnTime}</span>
              </div>
              <div className="detail-row">
                <span>Loại xe:</span>
                <span className="detail-value">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
              </div>
              <div className="total-rental-fee-box">
                <span>Tiền thuê xe đã trừ tiền giảm giá</span>
                <span className="total-fee">{formatCurrency(fees.totalCost + fees.deliveryFee - fees.discountAmount)}</span>
              </div>
            </div>

            <h2 className="section-title">Các bước thanh toán</h2>
            <div className="payment-steps-summary">
              <div className="payment-step-item">
                <div className="step-number completed">1</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán giữ chỗ qua Rentzy</p>
                  <p className="step-description">Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào tổng số tiền cần thanh toán khi nhận xe.</p>
                </div>
                <span className="step-amount">{formatCurrency(fees.holdFee)}</span>
              </div>
              <div className="payment-step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán số tiền còn lại khi nhận xe</p>
                  <div className="sub-details">
                    <p>Số tiền còn lại <span>{formatCurrency(fees.remainingAmount)}</span></p>
                    <p>Hoàn trả tiền cọc <span>-{formatCurrency(fees.holdFee)}</span></p>
                    <p>Số tiền thanh toán khi nhận xe <span>{formatCurrency(fees.remainingAmount)}</span></p>
                    <p>Tiền cọc xe sẽ được thanh toán sau khi hoàn thành chuyến đi <span>{formatCurrency(fees.deposit)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDeposit; 