import React, { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaCar, FaRegCircle } from 'react-icons/fa';
import './PaymentDeposit.css';
import Header from '../../../components/Header/Header';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';

const PaymentDeposit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [step, setStep] = useState(1); // 1: chờ cọc, 2: chờ thanh toán còn lại, 3: hoàn tất
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'deposit' | 'remaining'
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Lấy thông tin ví
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`, { withCredentials: true });
        setWallet(res.data.wallet);
      } catch (err) {
        setWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  // Lấy thông tin booking
  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}`, { withCredentials: true });
      setBooking(res.data.booking);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Xác định trạng thái và bước thanh toán
  useEffect(() => {
    if (!booking) return;
    // Đếm ngược nếu đang chờ thanh toán cọc
    if (booking.status === 'pending') {
      setStep(1);
      setPaymentStatus('pending');
      const createdAt = new Date(booking.createdAt).getTime();
      const tenMinutes = 10 * 60 * 1000;
      const expirationTime = createdAt + tenMinutes;
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setCountdown(timeLeft);
      setIsTimeUp(timeLeft <= 0);
    } else if (booking.status === 'deposit_paid') {
      setStep(2);
      setPaymentStatus('deposit_paid');
      setCountdown(0);
      setIsTimeUp(false);
    } else if (booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'fully_paid' || booking.status === 'completed') {
      setStep(3);
      setPaymentStatus('completed');
      setCountdown(0);
      setIsTimeUp(false);
    } else if (booking.status === 'canceled' || booking.status === 'refunded' || booking.status === 'rejected') {
      setStep(0);
      setPaymentStatus('canceled');
      setCountdown(0);
      setIsTimeUp(false);
    }
  }, [booking]);

  // Đếm ngược thời gian giữ chỗ
  useEffect(() => {
    if (step !== 1 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Tính toán số tiền còn lại phải thanh toán khi nhận xe
  const getPaidAndRemaining = () => {
    if (!booking) return { paid: 0, remaining: 0, deposit: 0, total: 0 };
    const total = booking.totalAmount || 0;
    const deposit = booking.deposit || 0;
    // Số tiền còn lại phải thanh toán là tổng tiền - tiền cọc
    const remaining = Math.max(0, total - deposit);
    return { paid: deposit, remaining, deposit, total };
  };
  const { paid, remaining, deposit, total } = getPaidAndRemaining();

  // Thanh toán cọc
  const handleDepositPayment = async () => {
    if (!booking || !wallet || wallet.balance < deposit) return;
    setIsPaying(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/wallet/deposit`,
        {
          amount: deposit,
          orderInfo: `Thanh toán tiền cọc cho đơn hàng ${booking._id}`,
          orderCode: booking._id,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Thanh toán tiền cọc thành công!');
        setTimeout(() => {
          navigate(`/`);
        }, 1200);
      } else {
        toast.error(res.data.message || 'Thanh toán thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi thanh toán tiền cọc.');
    } finally {
      setIsPaying(false);
    }
  };

  // Thanh toán phần còn lại
  const handleRemainingPayment = async () => {
    if (!booking || !wallet || remaining <= 0 || wallet.balance < remaining) return;
    setIsPaying(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/wallet/rental`,
        {
          bookingId: booking._id,
          amount: remaining,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Thanh toán phần còn lại thành công!');
        setTimeout(() => {
          navigate(`/confirm/${booking._id}`);
        }, 1200);
      } else {
        toast.error(res.data.message || 'Thanh toán thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi thanh toán phần còn lại.');
    } finally {
      setIsPaying(false);
    }
  };

  // Huỷ booking
  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsPaying(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/cancel`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Huỷ đơn thành công!');
        await fetchBooking();
      } else {
        toast.error(res.data.message || 'Huỷ đơn thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi huỷ đơn.');
    } finally {
      setIsPaying(false);
      setShowCancelModal(false);
    }
  };

  // Format helpers
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  // UI
  if (loading) return <Header><div className="loading-screen">Đang tải thông tin...</div></Header>;
  if (error) return <Header><div className="error-screen">Lỗi: {error}</div></Header>;
  if (!booking) return <Header><div className="error-screen">Không tìm thấy đơn hàng.</div></Header>;

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <Modal isOpen={showConfirmModal} onRequestClose={() => setShowConfirmModal(false)} className="confirm-modal" overlayClassName="modal-overlay" ariaHideApp={false}>
        <h2>Xác nhận thanh toán</h2>
        <p>Bạn có chắc chắn muốn thanh toán {confirmType === 'deposit' ? formatCurrency(deposit) : formatCurrency(remaining)} cho đơn này?</p>
        <div className="modal-actions">
          <button onClick={async () => {
            setShowConfirmModal(false);
            if (confirmType === 'deposit') await handleDepositPayment();
            else if (confirmType === 'remaining') await handleRemainingPayment();
          }} className="confirm-button">Đồng ý</button>
          <button onClick={() => setShowConfirmModal(false)} className="cancel-button">Huỷ</button>
        </div>
      </Modal>
      <div className="reservation-payment-container">
        <div className="progress-bar-wrapper">
          <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-icon"><FaCheck /></div>
              <span className="step-text">Tìm & chọn xe</span>
            </div>
            <div className={`progress-divider ${step > 1 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${step > 1 ? 'completed' : step === 1 ? 'current' : ''}`}> <div className="step-icon"><FaCar /></div> <span className="step-text">Thanh toán cọc</span></div>
            <div className={`progress-divider ${step > 2 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${step === 3 ? 'completed' : ''}`}> <div className="step-icon inactive"><FaRegCircle /></div> <span className="step-text">Nhận xe</span></div>
          </div>
        </div>
        <div className="content-wrapper">
          <div className="payment-details-section">
            {step === 1 && !isTimeUp && (
              <div className="deposit-section-beautiful">
                <h2 className="deposit-title">Thanh toán tiền cọc giữ xe</h2>
                <div className="deposit-amount-large">{formatCurrency(deposit)}</div>
                <div className="deposit-info-row">
                  <span className="deposit-label">Thời gian giữ chỗ còn lại:</span>
                  <span className="deposit-countdown">{formatTime(countdown)}</span>
                </div>
                <div className="deposit-info-row">
                  <span className="deposit-label">Mã đơn đặt xe:</span>
                  <span className="deposit-order-id">{booking._id}</span>
                </div>
                <div className="wallet-payment-section beautiful-wallet">
                  <h3 className="section-subtitle">Thanh toán bằng ví điện tử</h3>
                  {!walletLoading && wallet && (
                    <div className="wallet-info">
                      <p className="wallet-balance">Số dư ví: <strong>{formatCurrency(wallet.balance)}</strong></p>
                      {wallet.balance < deposit && (
                        <p className="wallet-insufficient">
                          ⚠️ Số dư không đủ. <a href="/profile/wallet" className="navigate-wallet">Nạp thêm tiền</a>
                        </p>
                      )}
                    </div>
                  )}
                  <p className="wallet-instruction">Nhấn nút bên dưới để thanh toán cọc bằng tiền trong ví.</p>
                  <button className="wallet-pay-button beautiful-pay-btn" onClick={() => { setConfirmType('deposit'); setShowConfirmModal(true); }} disabled={isPaying || walletLoading || !wallet || wallet.balance < deposit}>
                    {isPaying ? 'Đang xử lý...' : 'Thanh toán cọc'}
                  </button>
                </div>
              </div>
            )}
            {step === 1 && isTimeUp && (
              <div className="payment-expired-message text-center">
                <p>Thời gian thanh toán đã hết hạn.</p>
                <p>Đơn đặt xe của bạn đã bị hủy.</p>
                <button onClick={() => navigate('/')} className="confirm-button">Về Trang Chủ</button>
              </div>
            )}
            {step === 2 && (
              <>
                <h2 className="section-title">Thanh toán phần còn lại khi nhận xe</h2>
                <p className="deposit-amount">Cọc đã thanh toán: {formatCurrency(deposit)}</p>
                <div className="wallet-payment-section">
                  <h3 className="section-subtitle">Thanh toán phần còn lại bằng ví</h3>
                  <p>Số tiền còn lại cần thanh toán: <strong>{formatCurrency(remaining)}</strong></p>
                  {!walletLoading && wallet && (
                    <div className="wallet-info">
                      <p className="wallet-balance">Số dư ví: <strong>{formatCurrency(wallet.balance)}</strong></p>
                      {wallet.balance < remaining && (
                        <p className="wallet-insufficient">⚠️ Số dư không đủ. <a href="/profile/wallet" className="navigate-wallet">Nạp thêm tiền</a></p>
                      )}
                    </div>
                  )}
                  <button className="wallet-pay-button" onClick={() => { setConfirmType('remaining'); setShowConfirmModal(true); }} disabled={isPaying || walletLoading || !wallet || wallet.balance < remaining || remaining === 0}>{isPaying ? 'Đang xử lý...' : 'Thanh toán phần còn lại'}</button>
                </div>
              </>
            )}
            {(step === 1 || step === 2) && (
              <button className="cancel-booking-button" onClick={() => setShowCancelModal(true)} disabled={isPaying}>Huỷ đơn</button>
            )}
            {step === 3 && (
              <div className="payment-success-message text-center">
                <p>Đơn hàng đã được thanh toán đầy đủ!</p>
                <p>Mã đơn hàng: <strong>{booking._id}</strong></p>
                <button onClick={() => navigate(`/bookings/${bookingId}`)} className="confirm-button">Xem Đơn Hàng Của Tôi</button>
                <button onClick={() => navigate('/')} className="back-to-home-button">Về Trang Chủ</button>
              </div>
            )}
            {step === 0 && (
              <div className="payment-fail-message text-center">
                <p>Đơn đặt xe đã bị hủy hoặc không hợp lệ.</p>
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
              <div className="detail-row"><span>Mã đặt xe</span><span className="detail-value">{booking._id}</span></div>
              <div className="detail-row"><span>Tên khách thuê</span><span className="detail-value">{booking.renter?.name || 'N/A'}</span></div>
              <div className="detail-row"><span>Số điện thoại</span><span className="detail-value">{booking.renter?.phone || 'N/A'}</span></div>
              <div className="detail-row"><span>Ngày nhận:</span><span className="detail-value">{formatDate(booking.startDate)} {booking.pickupTime}</span></div>
              <div className="detail-row"><span>Ngày trả:</span><span className="detail-value">{formatDate(booking.endDate)} {booking.returnTime}</span></div>
              <div className="detail-row"><span>Loại xe:</span><span className="detail-value">{booking.vehicle?.brand} {booking.vehicle?.model}</span></div>
              <div className="total-rental-fee-box"><span>Tổng tiền thuê xe</span><span className="total-fee">{formatCurrency(total)}</span></div>
            </div>
            <h2 className="section-title">Các bước thanh toán</h2>
            <div className="payment-steps-summary">
              <div className={`payment-step-item ${step > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán cọc</p>
                  <p className="step-description">Đặt cọc để giữ xe, số tiền này sẽ được trừ vào tổng thanh toán khi nhận xe.</p>
                </div>
                <span className="step-amount">{formatCurrency(deposit)}</span>
              </div>
              <div className={`payment-step-item ${step === 3 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán phần còn lại khi nhận xe</p>
                  <div className="sub-details">
                    <p>Tiền thuê xe <span>{formatCurrency(total - deposit)}</span></p>
                
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
