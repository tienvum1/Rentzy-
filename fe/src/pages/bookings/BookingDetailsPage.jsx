import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import './BookingDetailsPage.css'; // We will create this CSS file next
import { FaCalendarAlt, FaDollarSign, FaCar, FaUser, FaMapMarkerAlt, FaInfoCircle, FaClipboardList, FaMoneyBillWave, FaCreditCard, FaTimesCircle, FaHandshake, FaTruck, FaCamera, FaTimes } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Modal from 'react-modal';
import { useAuth } from '../../context/AuthContext';

// Component: Hiển thị ảnh xe trước lúc nhận và nút xác nhận nhận xe cho người thuê (đẹp, hiện đại, có phóng to)
function PreRentalImagesViewer({ preRentalImages, renterHandoverConfirmed, onConfirmHandover, loading, booking, canShowButton }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  const handleImgClick = (url) => {
    setModalImg(url);
    setModalOpen(true);
  };

  // Điều kiện enable nút "Đã nhận xe"
  const canConfirmHandover =
    booking.status && booking.status.toLowerCase() === 'fully_paid' &&
    booking.ownerHandoverConfirmed &&
    !booking.renterHandoverConfirmed &&
    preRentalImages && preRentalImages.length === 5 &&
    !loading;

  return (
    <div className="pre-rental-card">
      <div className="pre-rental-header">
        <FaCamera style={{fontSize: 28, color: '#3182ce'}} />
        <span className="pre-rental-title">Ảnh xe trước lúc nhận (do chủ xe upload)</span>
      </div>
      <div className="pre-rental-desc">
        Vui lòng kiểm tra kỹ tình trạng xe thực tế và đối chiếu với ảnh trước khi xác nhận nhận xe. Nếu có vấn đề, hãy liên hệ chủ xe hoặc hỗ trợ trước khi xác nhận!
      </div>
      {preRentalImages && preRentalImages.length > 0 && (
        <div className="pre-rental-count">
          Đã upload {preRentalImages.length}/5 ảnh
        </div>
      )}
      {preRentalImages && preRentalImages.length > 0 && (
        <div className="pre-rental-grid">
          {preRentalImages.map((url, idx) => (
            <div key={idx} className="pre-rental-img-box" onClick={() => handleImgClick(url)} title="Nhấn để phóng to">
              <img
                src={url}
                alt={`Ảnh xe trước khi nhận ${idx + 1}`}
                className="pre-rental-img"
              />
              <div className="pre-rental-img-index">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
      {preRentalImages && preRentalImages.length < 5 && (
        <div className="pre-rental-warning">
          Chủ xe chưa upload đủ ảnh xe. Vui lòng chờ chủ xe upload đủ <b>5 ảnh</b> trước khi xác nhận nhận xe.
        </div>
      )}
      {/* Nút xác nhận đã nhận xe */}
      {canShowButton && (
        <div style={{marginTop: 18, display: 'flex', gap: 18, justifyContent: 'center'}}>
          <button
            className="pre-rental-btn"
            onClick={onConfirmHandover}
            disabled={!canConfirmHandover}
          >
            {loading ? (
              <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <span className="pre-rental-spinner" />
                Đang xác nhận...
              </span>
            ) : (
              <>
                {renterHandoverConfirmed ? 'Đã xác nhận nhận xe' : 'Đã nhận xe'}
              </>
            )}
          </button>
        </div>
      )}
      {/* Modal phóng to ảnh */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel="Xem ảnh lớn"
        ariaHideApp={false}
        style={{
          overlay: { background: 'rgba(0,0,0,0.7)', zIndex: 1000 },
          content: {
            top: '50%', left: '50%', right: 'auto', bottom: 'auto',
            marginRight: '-50%', transform: 'translate(-50%, -50%)',
            padding: 0, border: 'none',
            background: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }
        }}
      >
        <button onClick={() => setModalOpen(false)} className="pre-rental-modal-close">×</button>
        {modalImg && (
          <img src={modalImg} alt="Ảnh phóng to" className="pre-rental-modal-img" />
        )}
      </Modal>
    </div>
  );
}

// Component: Hiển thị ảnh xe khi nhận lại (sau khi hoàn tất)
function PostRentalImagesViewer({ postRentalImages, renterReturnConfirmed, onConfirmReturn, loading, booking, canShowButton }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  const handleImgClick = (url) => {
    setModalImg(url);
    setModalOpen(true);
  };

  // Điều kiện enable nút "Đã trả xe"
  const canConfirmReturn =
    booking.status && booking.status.toLowerCase() === 'in_progress' &&
    booking.ownerHandoverConfirmed &&
    booking.renterHandoverConfirmed &&
    booking.ownerReturnConfirmed &&
    !booking.renterReturnConfirmed &&
    postRentalImages && postRentalImages.length === 5 &&
    !loading;

  return (
    <div className="pre-rental-card">
      <div className="pre-rental-header">
        <FaCamera style={{fontSize: 28, color: '#3182ce'}} />
        <span className="pre-rental-title">Ảnh xe khi nhận lại (do chủ xe upload)</span>
      </div>
      <div className="pre-rental-desc">
        Đây là ảnh xe khi chủ xe nhận lại, lưu trữ cho mục đích đối chiếu và giải quyết tranh chấp (nếu có).
      </div>
      <div className="pre-rental-count">
        Đã upload {postRentalImages.length}/5 ảnh
      </div>
      <div className="pre-rental-grid">
        {postRentalImages.map((url, idx) => (
          <div key={idx} className="pre-rental-img-box" onClick={() => handleImgClick(url)} title="Nhấn để phóng to">
            <img
              src={url}
              alt={`Ảnh xe khi nhận lại ${idx + 1}`}
              className="pre-rental-img"
            />
            <div className="pre-rental-img-index">
              #{idx + 1}
            </div>
          </div>
        ))}
      </div>
      {/* Nút xác nhận đã trả xe */}
      {canShowButton && (
        <div style={{marginTop: 18, display: 'flex', gap: 18, justifyContent: 'center'}}>
          <button
            className="pre-rental-btn"
            onClick={onConfirmReturn}
            disabled={!canConfirmReturn}
          >
            {loading ? (
              <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <span className="pre-rental-spinner" />
                Đang xác nhận...
              </span>
            ) : (
              <>
                {renterReturnConfirmed ? 'Đã xác nhận trả xe' : 'Đã trả xe'}
              </>
            )}
          </button>
        </div>
      )}
      {/* Modal phóng to ảnh */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel="Xem ảnh lớn"
        ariaHideApp={false}
        style={{
          overlay: { background: 'rgba(0,0,0,0.7)', zIndex: 1000 },
          content: {
            top: '50%', left: '50%', right: 'auto', bottom: 'auto',
            marginRight: '-50%', transform: 'translate(-50%, -50%)',
            padding: 0, border: 'none',
            background: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }
        }}
      >
        <button onClick={() => setModalOpen(false)} className="pre-rental-modal-close">×</button>
        {modalImg && (
          <img src={modalImg} alt="Ảnh phóng to" className="pre-rental-modal-img" />
        )}
      </Modal>
    </div>
  );
}

function calculateRefund(booking, now = new Date()) {
  const startDate = new Date(booking.startDate);
  const diffMs = startDate - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const totalAmount = booking.totalAmount || 0;

  if (diffHours > 1) {
    if (diffDays > 7) {
      // Huỷ trước 7 ngày: hoàn 70%
      return {
        refund: Math.round(totalAmount * 0.7),
        lost: Math.round(totalAmount * 0.3),
        policy: 'refund_70'
      };
    } else {
      // Trong 7 ngày: hoàn 30%
      return {
        refund: Math.round(totalAmount * 0.3),
        lost: Math.round(totalAmount * 0.7),
        policy: 'refund_30'
      };
    }
  } else if (diffHours > 0) {
    // Huỷ trước 1h: hoàn 100%
    return {
      refund: totalAmount,
      lost: 0,
      policy: 'refund_100'
    };
  } else {
    // Đã đến giờ nhận xe hoặc sau đó: không hoàn tiền
    return {
      refund: 0,
      lost: totalAmount,
      policy: 'no_refund'
    };
  }
}

function calculateDepositRefund(booking, now = new Date()) {
  const startDate = new Date(booking.startDate);
  // Lấy thời điểm thanh toán cọc thực tế
  let depositTime = booking.createdAt;
  if (booking.transactions && booking.transactions.length > 0) {
    const depositTx = booking.transactions.find(
      t => t.type === 'RENTAL' && t.status === 'COMPLETED'
    );
    if (depositTx) {
      depositTime = depositTx.createdAt;
    }
  }
  // Chuyển depositTime và now về múi giờ Việt Nam (UTC+7)
  const depositTimeVN = moment(depositTime);
  const nowVN = moment(now);
  const diffMs = startDate - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const depositAmount = booking.depositAmount || 0;
  // Thời gian từ lúc đặt cọc đến lúc huỷ (giờ Việt Nam)
  const cancelSinceDeposit = nowVN.diff(depositTimeVN, 'milliseconds');
  const cancelSinceDepositHours = cancelSinceDeposit / (1000 * 60 * 60);

  if (cancelSinceDepositHours <= 1) {
    // Vừa đặt cọc trong vòng 1h, huỷ hoàn 100%
    return {
      refund: depositAmount,
      lost: 0,
      policy: 'refund_100_new_1h'
    };
  } else if (diffDays > 7) {
    // Huỷ trước 7 ngày: hoàn 50%
    return {
      refund: Math.round(depositAmount * 0.5),
      lost: Math.round(depositAmount * 0.5),
      policy: 'refund_50'
    };
  } else if (diffMs > 0) {
    // Trong 7 ngày trước khi nhận xe (kể cả 1h cuối): mất 100%
    return {
      refund: 0,
      lost: depositAmount,
      policy: 'lost_100_7days'
    };
  } else {
    // Đã đến giờ nhận xe hoặc sau đó: mất 100%
    return {
      refund: 0,
      lost: depositAmount,
      policy: 'lost_100_after'
    };
  }
}

const BookingDetailsPage = () => {
  const { id } = useParams(); // Get booking ID from URL
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carId, setCarId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  // State lưu thông tin hoàn tiền từ BE
  const [expectedRefund, setExpectedRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0); // Thêm state lưu số tiền hoàn lại
  const { user } = useAuth();
  const [handoverLoading, setHandoverLoading] = useState(false);

  // Thêm ref để gọi lại fetchBookingDetails sau khi huỷ thành công
  const fetchBookingDetailsRef = useRef();
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const config = {
          withCredentials: true,
        };
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}`, config);
        setBooking(res.data.booking);
        setCarId(res.data.carId);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Vui lòng đăng nhập để xem chi tiết đơn hàng.");
          navigate('/login');
        } else if (err.response?.status === 404) {
          toast.error("Không tìm thấy đơn hàng này.");
        } else {
          toast.error('Có lỗi xảy ra khi tải chi tiết đơn hàng.');
        }
      }
    };
    fetchBookingDetailsRef.current = fetchBookingDetails;
    fetchBookingDetails();
  }, [id, navigate]);

  if (loading) {
    return <div className="booking-details-container">Đang tải chi tiết đơn hàng...</div>;
  }

  if (error) {
    return <div className="booking-details-container error-message">{error}</div>;
  }

  if (!booking) {
    return <div className="booking-details-container">Không tìm thấy thông tin đơn hàng.</div>;
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'DEPOSIT_PAID':
        return 'Đã thanh toán tiền giữ chỗ';
      case 'RENTAL_PAID':
        return 'Đã thanh toán đầy đủ';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#1E90FF';
      case 'DEPOSIT_PAID':
        return '#32CD32';
      case 'RENTAL_PAID':
        return '#32CD32';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#FF0000';
      default:
        return '#666';
    }
  };

  // Tính toán số tiền đã thanh toán và còn lại
  const calculatePaymentDetails = () => {
    // Tổng tiền khách đã trả (không trừ hoàn tiền)
    const totalPaid = booking.transactions.reduce((sum, transaction) => {
      if (transaction.status === 'COMPLETED' && transaction.type !== 'REFUND') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);
    // Tổng tiền đã hoàn lại
    const totalRefund = booking.transactions.reduce((sum, transaction) => {
      if (transaction.status === 'COMPLETED' && transaction.type === 'REFUND') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);
    // Số tiền còn lại phải trả (nếu đã hoàn tiền hoặc đã huỷ thì là 0)
    let remaining = booking.status === 'RENTAL_PAID' ? 0 : booking.totalAmount - totalPaid;
    if (
      booking.status === 'canceled' || booking.status === 'CANCELED' ||
      booking.status === 'refunded' || booking.status === 'REFUNDED'
    ) {
      remaining = 0;
    }
    // Không hiển thị số âm
    if (remaining < 0) remaining = 0;
    return {
      totalPaid,
      totalRefund,
      remaining
    };
  };

  const { totalPaid, totalRefund, remaining } = calculatePaymentDetails();

  // Hàm huỷ đặt xe với hoàn tiền
  // Khi mở modal huỷ, gọi API lấy thông tin hoàn tiền
  const handleCancelBooking = async () => {
    setCancelError('');
    setShowCancelModal(true);
    try {
      const config = { withCredentials: true };
      const refundRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/expected-refund`,
        config
      );
      if (refundRes.data.success && refundRes.data.data) {
        setExpectedRefund(refundRes.data.data);
        setRefundAmount(refundRes.data.data.refund ?? 0); // Lưu lại số tiền hoàn vào state
      } else {
        setExpectedRefund(null);
        setRefundAmount(0);
      }
    } catch (err) {
      setExpectedRefund(null);
      setRefundAmount(0);
    }
  };

  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do huỷ đơn.');
      return;
    }
    try {
      const config = { withCredentials: true };
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/request-cancel`,
        {
          reason: cancelReason,
          totalRefund: refundAmount // Truyền đúng số tiền hoàn lại
        },
        config
      );
      if (res.data.success) {
        toast.success('Yêu cầu huỷ đơn đã được gửi thành công! Vui lòng chờ chủ xe duyệt.');
        setShowCancelModal(false);
        setCancelReason('');
        setCancelError('');
        // Gọi lại fetchBookingDetails để cập nhật trạng thái
        if (fetchBookingDetailsRef.current) {
          await fetchBookingDetailsRef.current();
        }
      } else {
        toast.error(res.data.message || 'Không thể gửi yêu cầu huỷ.');
        setCancelError(res.data.message || 'Không thể gửi yêu cầu huỷ.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu huỷ.');
      setCancelError(err.response?.data?.message || 'Không thể gửi yêu cầu huỷ.');
    }
  };

  // --- Xác nhận giao xe/trả xe cho renter ---
  const handleConfirmHandover = async () => {
    setHandoverLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/confirm-handover`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Bạn đã xác nhận nhận xe!');
        // Reload booking
        const updated = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}`, { withCredentials: true });
        setBooking(updated.data.booking);
      } else {
        toast.error(res.data.message || 'Xác nhận thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xác nhận nhận xe.');
    } finally {
      setHandoverLoading(false);
    }
  };
  const handleConfirmReturn = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/confirm-return`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Bạn đã xác nhận trả xe!');
        // Reload booking
        const updated = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}`, { withCredentials: true });
        setBooking(updated.data.booking);
      } else {
        toast.error(res.data.message || 'Xác nhận thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xác nhận trả xe.');
    }
  };
  // --- END nút xác nhận giao xe/trả xe ---

  return (
    <>
    <Header/>
    {/* Chỉ hiển thị phần ảnh xe chủ xe upload ở đầu trang */}
    {user && booking.renter && user._id === booking.renter._id && (
      <PreRentalImagesViewer
        preRentalImages={booking.preRentalImages}
        renterHandoverConfirmed={booking.renterHandoverConfirmed}
        onConfirmHandover={handleConfirmHandover}
        loading={handoverLoading}
        booking={booking}
        canShowButton={booking.status && booking.status.toLowerCase() === 'fully_paid' && booking.ownerHandoverConfirmed && !booking.renterHandoverConfirmed && booking.preRentalImages && booking.preRentalImages.length === 5}
      />
    )}
    {booking.status  && booking.postRentalImages && booking.postRentalImages.length === 5 && (
      <PostRentalImagesViewer 
        postRentalImages={booking.postRentalImages}
        renterReturnConfirmed={booking.renterReturnConfirmed}
        onConfirmReturn={user && booking.renter && user._id === booking.renter._id ? handleConfirmReturn : undefined}
        loading={handoverLoading}
        booking={booking}
        canShowButton={user && booking.renter && user._id === booking.renter._id && booking.status && booking.status.toLowerCase() === 'in_progress' && booking.ownerHandoverConfirmed && booking.renterHandoverConfirmed && booking.ownerReturnConfirmed && !booking.renterReturnConfirmed && booking.postRentalImages && booking.postRentalImages.length === 5}
      />
    )}

    <div className="booking-details-container">
      <h2>Chi tiết Đơn hàng #{booking._id}</h2>

      <div className="booking-summary-card">
        <h3><FaClipboardList /> Thông tin Đặt xe</h3>
        <div className="info-grid">
          <p><strong>Ngày nhận:</strong> {moment(booking.startDate).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Ngày trả:</strong> {moment(booking.endDate).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Địa điểm nhận xe:</strong> {booking.pickupLocation}</p>
          <p><strong>Địa điểm trả xe:</strong> {booking.returnLocation}</p>
          <p><strong>Tổng số ngày thuê:</strong> {booking.totalDays} ngày</p>
          <p><strong>Trạng thái:</strong> <span className={`status-${booking.status.toLowerCase()}`}>{getStatusText(booking.status)}</span></p>
          
         
         {booking.note && <p><strong>Ghi chú:</strong> {booking.note}</p>}
        </div>
      </div>

      <div className="booking-summary-card">
        <h3><FaCar /> Thông tin Xe</h3>
        <div className="vehicle-details-grid">
          <div className="vehicle-image-container">
            {booking.vehicle?.primaryImage ? (
              <img src={booking.vehicle.primaryImage} alt={`${booking.vehicle.brand} ${booking.vehicle.model}`} className="booking-vehicle-image" />
            ) : booking.vehicle?.gallery && booking.vehicle.gallery.length > 0 ? (
              <img src={booking.vehicle.gallery[0]} alt={`${booking.vehicle.brand} ${booking.vehicle.model}`} className="booking-vehicle-image" />
            ) : (
              <div className="no-image-placeholder-details">Không có ảnh</div>
            )}
          </div>
          <div className="vehicle-text-details">
            <div className="vehicle-info-section">
              <h4>Thông tin cơ bản</h4>
              <div className="info-row">
                <span className="info-label">Tên xe:</span>
                <span className="info-value">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Biển số:</span>
                <span className="info-value">{booking.vehicle?.licensePlate}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Giá thuê/ngày:</span>
                <span className="info-value price">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.vehicle?.pricePerDay)}
                </span>
              </div>            
            </div>

            <div className="vehicle-info-section">
              <h4>Thông tin chủ xe</h4>
              <div className="info-row">
                <span className="info-label">Họ tên:</span>
                <span className="info-value">{booking.vehicle?.owner?.name || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{booking.vehicle?.owner?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Điện thoại:</span>
                <span className="info-value">{booking.vehicle?.owner?.phone || 'N/A'}</span>
              </div>
            </div>

            <button 
              className="view-vehicle-details-button"
              onClick={() => navigate(`/vehicles/${carId || booking.vehicle?._id}`)}
            >
              <FaInfoCircle /> Xem chi tiết xe
            </button>
          </div>
        </div>
      </div>

      <div className="booking-summary-card">
        <h3><FaDollarSign /> Tóm tắt Thanh toán</h3>
        <div className="payment-summary-grid">
          <div className="payment-row">
            <span className="payment-label">Phí thuê xe:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalCost)}</span>
          </div>
          {booking.deliveryFee > 0 && (
            <div className="payment-row">
              <span className="payment-label">Phí giao xe (2 chiều):</span>
              <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.deliveryFee)}</span>
            </div>
          )}
          {booking.discountAmount > 0 && (
            <div className="payment-row discount">
              <span className="payment-label">Giảm giá:</span>
              <span className="payment-value">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.discountAmount)}</span>
            </div>
          )}
    
          <div className="payment-row total">
            <span className="payment-label">Tổng tiền đơn hàng:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</span>
          </div>
          <div className="payment-row paid">
            <span className="payment-label">Đã thanh toán:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}</span>
          </div>
         
          <div className="payment-row remaining">
            <span className="payment-label">Còn lại phải trả:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining)}</span>
          </div>
          {totalRefund > 0 && (
            <div className="payment-row refund-row">
              <span className="payment-label">Đã hoàn tiền:</span>
              <span className="payment-value" style={{ color: '#2563eb' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRefund)}</span>
            </div>
          )}
          {/* Nút thanh toán phần còn lại */}
          {booking.status === 'deposit_paid' && remaining > 0 && (
            <div className="payment-action">
              <button 
                className="pay-remaining-details-button"
                onClick={() => navigate(`/payment-remaining/${booking._id}`)}
              >
                <FaCreditCard /> Thanh toán phần còn lại ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining)})
              </button>
            </div>
          )}
          <div className="payment-row remaining">
            <span className="payment-value"> Hạn thanh toán : {moment(booking.endDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        </div>
      </div>

      

      <div className="booking-summary-card">
        <h3><FaMoneyBillWave /> Lịch sử Giao dịch</h3>
        {booking.transactions.length === 0 ? (
          <p>Chưa có giao dịch nào cho đơn hàng này.</p>
        ) : (
          <div className="transactions-list">
            {booking.transactions.map(transaction => (
              <div key={transaction._id} className="transaction-item">
                <p><strong>Mã GD:</strong> {transaction._id}</p>
                <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}</p>
                <p><strong>Loại GD:</strong> {transaction.type === 'DEPOSIT' ? 'Tiền giữ chỗ' : 'Tiền thuê xe'}</p>
                <p><strong>Trạng thái:</strong> <span className={`status-${transaction.status.toLowerCase()}`}>{transaction.status === 'COMPLETED' ? 'Hoàn thành' : transaction.status}</span></p>
                <p><strong>PTTT:</strong> {transaction.paymentMethod}</p>
                <p><strong>Thời gian:</strong> {moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Chính sách hoàn tiền */}
      <div className="refund-policy-card" style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20,
        margin: '24px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        maxWidth: 900,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <h3 style={{ color: '#2563eb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMoneyBillWave style={{fontSize: 22}} /> Chính sách hoàn tiền tiền cọc khi huỷ đặt xe
        </h3>
        <ul style={{ fontSize: 16, color: '#334155', margin: 0, paddingLeft: 24 }}>
        <li style={{ marginBottom: 8 }}>
            <b>Huỷ trong vòng 1 giờ sau khi đặt :</b> <span style={{ color: '#f59e42', fontWeight: 600 }}>Hoàn 100% tiền đã thanh toán </span>
          </li>
          <li style={{ marginBottom: 8 }}>
            <b>Huỷ trước 7 ngày:</b> <span style={{ color: '#f59e42', fontWeight: 600 }}>Hoàn 50% tiền cọc</span>, <span style={{ color: '#ef4444', fontWeight: 600 }}>mất 50%</span>
          </li>
          <li style={{ marginBottom: 8 }}>
            <b>Huỷ trong vòng 7 ngày trước khi nhận xe:</b> <span style={{ color: '#ef4444', fontWeight: 600 }}>Mất 100% tiền cọc</span>
          </li>
          <li>
            <b>Huỷ sau thời điểm nhận xe hoặc không tới nhận xe:</b> <span style={{ color: '#ef4444', fontWeight: 600 }}>Không hoàn tiền (tổng tiền đã thanh toán)</span>
          </li>
        </ul>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 10 }}>
          <FaInfoCircle style={{marginRight: 6, color: '#2563eb'}} />
          Chính sách này chỉ áp dụng cho phần tiền cọc đã thanh toán (thường là 30% tổng đơn hàng).
        </div>
      </div>

      <div className="booking-details-actions">
        <button className="back-button" onClick={() => navigate('/profile/my-bookings')}>
          Quay lại
        </button>

        {/* --- END nút xác nhận giao xe/trả xe --- */}
        {(() => {
          const now = new Date();
          const startDate = new Date(booking.startDate);
          const canCancel = booking.status !== 'canceled' && 
                           booking.status !== 'completed' && 
                           startDate > now &&
                           booking.status !== 'cancel_requested';
          
          if (canCancel) {
            return (
              <>
                <button
                  className="cancel-booking-button"
                  onClick={handleCancelBooking}
                >
                  <FaTimesCircle style={{ marginRight: 8, fontSize: 18 }} />
                  Huỷ đặt xe
                </button>
                <Modal
                  isOpen={showCancelModal}
                  onRequestClose={() => setShowCancelModal(false)}
                  contentLabel="Lý do huỷ đơn"
                  ariaHideApp={false}
                  className="cancel-modal beautiful-cancel-modal"
                  overlayClassName="cancel-modal-overlay beautiful-cancel-modal-overlay"
                >
                  <div style={{
                    maxWidth: 900,
                    margin: '0 auto',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 18,
                    position: 'relative',
                  }}>
                    <h2 style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 22,
                      marginBottom: 8,
                      color: '#1a202c',
                      letterSpacing: 0.5,
                    }}>
                      <span role="img" aria-label="cancel">❌</span> Huỷ đặt xe
                    </h2>
                    <label style={{ fontWeight: 500, marginBottom: 4 }}>Lý do huỷ đơn <span style={{ color: 'red' }}>*</span></label>
                    <textarea
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="Nhập lý do huỷ đơn..."
                      rows={3}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 15,
                        resize: 'vertical',
                        outline: 'none',
                        marginBottom: 0,
                        minHeight: 60,
                      }}
                      className="cancel-reason-textarea"
                    />
                    {cancelError && <div style={{ color: 'red', fontSize: 14, marginBottom: 4 }}>{cancelError}</div>}
                    {expectedRefund && (
                      <div className="expected-refund-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span role="img" aria-label="refund">💸</span>
                          <b>Chi tiết hoàn tiền cọc của bạn:</b>
                        </div>
                        <div style={{fontSize: 15, color: '#0f172a', marginBottom: 10, fontWeight: 500}}>
                          <span role="img" aria-label="clock">⏰</span> <b>Thời gian đặt cọc:</b> {expectedRefund.cancelTime ? new Date(expectedRefund.cancelTime).toLocaleString('vi-VN') : ''}<br/>
                          <span role="img" aria-label="car">🚗</span> <b>Thời gian nhận xe:</b> {expectedRefund.pickupTime ? new Date(expectedRefund.pickupTime).toLocaleString('vi-VN') : ''}<br/>
                        </div>
                        <div style={{color:'#2563eb', fontWeight:600, marginBottom:12, fontSize:16}}>{expectedRefund.message}</div>
                        {/* Chỉ hiển thị block policy đúng với expectedRefund.policy */}
                        {expectedRefund.policy === 'refund_100_1h' && (
                          <div style={{ background:'#e0f2fe', borderRadius:8, fontWeight:600, border:'2px solid #38bdf8', boxShadow:'0 2px 12px rgba(56,189,248,0.10)', padding:12, marginBottom:12 }}>
                            <span role="img" aria-label="star">⭐</span> <b>Huỷ trong vòng 1 giờ sau khi đặt cọc</b>:<br/>
                            Hoàn <b style={{color:'#059669'}}>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b> (100%)<br/>
                            Số tiền bị mất: <b style={{color:'#ef4444'}}>{expectedRefund.lost?.toLocaleString('vi-VN')}đ</b>
                          </div>
                        )}
                        {expectedRefund.policy === 'refund_50' && (
                          <div style={{ background:'#fff7ed', borderRadius:8, fontWeight:600, border:'2px solid #f59e42', boxShadow:'0 2px 12px rgba(245,158,66,0.10)', padding:12, marginBottom:12 }}>
                            <span role="img" aria-label="half">🌓</span> <b>Huỷ trước 7 ngày</b>:<br/>
                            Hoàn <b style={{color:'#f59e42'}}>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b> (50%)<br/>
                            Số tiền bị mất: <b style={{color:'#ef4444'}}>{expectedRefund.lost?.toLocaleString('vi-VN')}đ</b> (50%)
                          </div>
                        )}
                        {expectedRefund.policy === 'lost_100_7days' && (
                          <div style={{ background:'#fef2f2', borderRadius:8, fontWeight:600, border:'2px solid #ef4444', boxShadow:'0 2px 12px rgba(239,68,68,0.10)', padding:12, marginBottom:12 }}>
                            <span role="img" aria-label="cross">❌</span> <b>Huỷ trong vòng 7 ngày trước khi nhận xe (kể cả 1h cuối)</b>:<br/>
                            Hoàn <b style={{color:'#ef4444'}}>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b><br/>
                            Số tiền bị mất: <b style={{color:'#ef4444'}}>{expectedRefund.lost?.toLocaleString('vi-VN')}đ</b> (100%)
                          </div>
                        )}
                        {expectedRefund.policy === 'lost_100_after' && (
                          <div style={{ background:'#fef2f2', borderRadius:8, fontWeight:600, border:'2px solid #ef4444', boxShadow:'0 2px 12px rgba(239,68,68,0.10)', padding:12, marginBottom:12 }}>
                            <span role="img" aria-label="cross">❌</span> <b>Huỷ sau thời điểm nhận xe hoặc không tới nhận xe/quá giờ:</b><br/>
                            Hoàn <b style={{color:'#ef4444'}}>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b><br/>
                            Số tiền bị mất: <b style={{color:'#ef4444'}}>{expectedRefund.lost?.toLocaleString('vi-VN')}đ</b> (100%)
                          </div>
                        )}
                        <div style={{ fontSize: 14, color: '#64748b', marginTop: 10 }}>
                          Số tiền cọc đã thanh toán của bạn: <b>{expectedRefund.depositAmount?.toLocaleString('vi-VN')}đ</b> (thường là 30% tổng đơn hàng).
                        </div>
                        <div style={{ fontSize: 15, color: '#0f172a', marginTop: 12, fontWeight: 600 }}>
                          <span role="img" aria-label="money">🪙</span> Số tiền bạn sẽ được hoàn lại nếu huỷ lúc này: <span style={{ color: expectedRefund.refund > 0 ? '#059669' : '#ef4444', fontWeight: 700 }}>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {/* Nếu đã thanh toán đủ đơn hàng, hiển thị rõ số tiền hoàn lại là tổng đã thanh toán trừ phần cọc bị mất */}
                        {expectedRefund.totalPaid >= expectedRefund.totalAmount && (
                          <div style={{ fontSize: 14, color: '#475569', marginTop: 8, fontWeight: 500 }}>
                            (Bạn đã thanh toán đủ đơn hàng. Khi huỷ, số tiền hoàn lại là tổng đã thanh toán trừ phần cọc bị mất: <b>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b>)
                          </div>
                        )}
                        {/* Nếu chỉ thanh toán cọc */}
                        {expectedRefund.totalPaid < expectedRefund.totalAmount && (
                          <div style={{ fontSize: 14, color: '#475569', marginTop: 8, fontWeight: 500 }}>
                            (Bạn mới chỉ thanh toán tiền cọc. Khi huỷ, số tiền hoàn lại là phần cọc được hoàn: <b>{expectedRefund.refund?.toLocaleString('vi-VN')}đ</b>)
                          </div>
                        )}
                        {expectedRefund.lost > 0 && (
                          <div style={{ fontSize: 15, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>
                            <span role="img" aria-label="lost">⚠️</span> Số tiền bạn sẽ bị mất: <b>{expectedRefund.lost?.toLocaleString('vi-VN')}đ</b>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }} className="cancel-modal-actions">
                      <button
                        className="submit-cancel-btn"
                        style={{
                          flex: 1,
                          background: 'linear-gradient(90deg,#3182ce 0%,#63b3ed 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 16,
                          padding: '10px 0',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(49,130,206,0.08)',
                          transition: 'background 0.2s',
                        }}
                        onClick={submitCancelRequest}
                      >
                        Gửi yêu cầu huỷ
                      </button>
                      <button
                        className="close-cancel-btn"
                        style={{
                          flex: 1,
                          background: '#e2e8f0',
                          color: '#2d3748',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 500,
                          fontSize: 16,
                          padding: '10px 0',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => setShowCancelModal(false)}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </Modal>
              </>
            );
          } else if (booking.status === 'canceled') {
            return (
              <div className="cancel-info">
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  <FaTimesCircle style={{ marginRight: 8 }} />
                  Đơn đã bị hủy
                </span>
              </div>
            );
          } else if (booking.status === 'completed') {
            return (
              <div className="completed-info">
                <span style={{ color: '#27ae60', fontWeight: 'bold' ,fontSize : '20px'}}>
                  ✓ Đơn đã hoàn thành
                </span>
              </div>
            );
          }
          else if (booking.status === 'cancel_requested') {
            return (
              <div className="completed-info">
               <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  ✓ Đã gửi yêu cầu huỷ 
                </span>
              </div>
            );
          } else if (startDate <= now) {
            return (
              <div className="started-info">
                <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
                  ⏰ Chuyến đi đã bắt đầu
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
     <Footer/>
     </>
   
  );
 
};

export default BookingDetailsPage;