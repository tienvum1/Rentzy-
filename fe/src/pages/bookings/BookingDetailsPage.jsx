import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import './BookingDetailsPage.css'; // We will create this CSS file next
import { FaCalendarAlt, FaDollarSign, FaCar, FaUser, FaMapMarkerAlt, FaInfoCircle, FaClipboardList, FaMoneyBillWave, FaCreditCard, FaTimesCircle } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Modal from 'react-modal';

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
  const [expectedRefund, setExpectedRefund] = useState(null);

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
  const handleCancelBooking = async () => {
    setCancelError('');
    setShowCancelModal(true);
    // Fetch expected refund info
    try {
      const config = { withCredentials: true };
      const refundRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/expected-refund`,
        config
      );
      if (refundRes.data.success) {
        setExpectedRefund(refundRes.data.data);
      } else {
        setExpectedRefund(null);
      }
    } catch (err) {
      setExpectedRefund(null);
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
          totalRefund: expectedRefund?.totalRefund ?? undefined
        },
        config
      );
      if (res.data.success) {
        toast.success('Yêu cầu huỷ đơn đã được gửi. Vui lòng chờ chủ xe duyệt!');
        setShowCancelModal(false);
        setCancelReason('');
        setCancelError('');
        // Optionally refresh booking status here
      } else {
        setCancelError(res.data.message || 'Không thể gửi yêu cầu huỷ.');
      }
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể gửi yêu cầu huỷ.');
    }
  };

  return (
    <>
    <Header/>
    <div className="booking-details-container">
      <h2>Chi tiết Đơn hàng #{booking._id}</h2>

      <div className="booking-summary-card">
        <h3><FaClipboardList /> Thông tin Đặt xe</h3>
        <div className="info-grid">
          <p><strong>Ngày nhận:</strong> {moment(booking.startDate).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Ngày trả:</strong> {moment(booking.endDate).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Tổng số ngày thuê:</strong> {booking.totalDays} ngày</p>
          <p><strong>Trạng thái:</strong> <span className={`status-${booking.status.toLowerCase()}`}>{getStatusText(booking.status)}</span></p>
          <p><strong>Địa điểm nhận xe:</strong> {booking.pickupLocation}</p>
          <p><strong>Địa điểm trả xe:</strong> {booking.returnLocation}</p>
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
              <div className="info-row">
                <span className="info-label">Tiền đặt cọc:</span>
                <span className="info-value price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.vehicle.deposit)}</span>
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
          <div className="payment-row">
            <span className="payment-label">Tiền cọc xe:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.deposit)}</span>
          </div>
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

      <div className="booking-details-actions">
        <button className="back-button" onClick={() => navigate(-1)}>
          Quay lại
        </button>
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
                    maxWidth: 400,
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
                      <div
                        className="expected-refund-info"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span role="img" aria-label="refund">💸</span>
                          <b>Chính sách hoàn tiền:</b>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                          <li>Trước 7 ngày: Hoàn 80% tiền cọc</li>
                          <li>Trong 7 ngày: Hoàn 30% tiền cọc</li>
                          <li>Trong thời gian thuê: Không hoàn tiền</li>
                          <li>Nếu đã thanh toán toàn bộ: Hoàn lại tiền thuê xe + % tiền cọc theo chính sách</li>
                        </ul>
                        <div style={{ marginTop: 8, fontWeight: 600, color: '#3182ce', fontSize: 16 }}>
                          <span role="img" aria-label="money">🪙</span>
                          {expectedRefund.refundType === 'full' ? (
                            <>
                              {expectedRefund.rentalRefund > 0 && (
                                <span>
                                  Hoàn tiền thuê xe: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expectedRefund.rentalRefund || 0)}<br/>
                                </span>
                              )}
                              {expectedRefund.depositRefund > 0 && (
                                <span>
                                  Hoàn tiền cọc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expectedRefund.depositRefund || 0)}<br/>
                                </span>
                              )}
                              <b>Tổng tiền dự kiến hoàn: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expectedRefund.totalRefund || 0)}</b><br/>
                              <span style={{ fontWeight: 400, color: '#475569', fontSize: 14 }}>(Bạn đã thanh toán toàn bộ, sẽ hoàn lại tiền thuê xe + % tiền cọc theo chính sách)</span>
                            </>
                          ) : (
                            <>
                              Số tiền dự kiến hoàn: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expectedRefund.depositRefund || 0)}
                            </>
                          )}
                        </div>
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
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  ✓ Đơn đã hoàn thành
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