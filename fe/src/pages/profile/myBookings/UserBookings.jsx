import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCreditCard, FaStar, FaTimesCircle } from 'react-icons/fa';
import './UserBookings.css';
import ProfileLayout from '../profileLayout/ProfileLayout';
import { reviewBooking } from '../../../services/vehicleService';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const config = {
        withCredentials: true,
      };
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/bookings/my-bookings`;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const res = await axios.get(url, config);
      setBookings(res.data.bookings);
      setError(null);
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để xem lịch sử đặt xe.");
        navigate('/login');
      } else {
        toast.error('Có lỗi xảy ra khi tải danh sách đặt xe.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ xử lý';
      case 'deposit_paid':
        return 'Đã thanh toán tiền giữ chỗ';
      case 'fully_paid':
        return 'Đã thanh toán toàn bộ';
      case 'in_progress':
        return 'Đang thuê xe';
      case 'completed':
        return 'Đã hoàn thành';
      case 'canceled':
        return 'Đã huỷ';
      case 'refunded':
        return 'Đã hoàn tiền';
      case 'rejected':
        return 'Bị từ chối';
      case 'cancel_requested':
        return 'Đang chờ huỷ';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const calculatePaymentDetails = (booking) => {
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
    let remainingAmount = booking.status === 'RENTAL_PAID' ? 0 : booking.totalAmount - totalPaid;
    if (
      booking.status === 'canceled' || booking.status === 'CANCELED' ||
      booking.status === 'refunded' || booking.status === 'REFUNDED'
    ) {
      remainingAmount = 0;
    }

    return {
      totalPaid,
      totalRefund,
      remainingAmount
    };
  };

  const handleOpenReview = (bookingId) => {
    setReviewBookingId(bookingId);
    setShowReviewModal(true);
    setReviewStars(5);
    setReviewContent("");
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
    setReviewBookingId(null);
    setReviewStars(5);
    setReviewContent("");
  };

  const handleSubmitReview = async () => {
    if (!reviewStars || !reviewContent.trim()) {
      toast.error("Vui lòng chọn số sao và nhập nội dung đánh giá.");
      return;
    }
    setReviewSubmitting(true);
    try {
      await reviewBooking(reviewBookingId, reviewStars, reviewContent);
      toast.success("Đánh giá của bạn đã được gửi!");
      handleCloseReview();
      fetchBookings(); // Reload lại danh sách để ẩn nút đánh giá
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenCancel = (bookingId) => {
    setCancelBookingId(bookingId);
    setShowCancelModal(true);
    setCancelReason('');
    setCancelError('');
  };

  const handleCloseCancel = () => {
    setShowCancelModal(false);
    setCancelBookingId(null);
    setCancelReason('');
    setCancelError('');
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do huỷ đơn.');
      return;
    }
    setCancelSubmitting(true);
    try {
      const config = { withCredentials: true };
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${cancelBookingId}/request-cancel`,
        {
          reason: cancelReason
        },
        config
      );
      if (res.data.success) {
        toast.success('Yêu cầu huỷ đơn đã được gửi thành công! Vui lòng chờ chủ xe duyệt.');
        handleCloseCancel();
        fetchBookings(); // Reload lại danh sách
      } else {
        toast.error(res.data.message || 'Không thể gửi yêu cầu huỷ.');
        setCancelError(res.data.message || 'Không thể gửi yêu cầu huỷ.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu huỷ.');
      setCancelError(err.response?.data?.message || 'Không thể gửi yêu cầu huỷ.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <ProfileLayout>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      {loading ? (
        <div className="user-bookings-container">
          <div className="loading-message">Đang tải danh sách đặt xe...</div>
        </div>
      ) : error ? (
        <div className="user-bookings-container">
          <div className="error-message">{error}</div>
        </div>
      ) : (
        <div className="user-bookings-container">
          <div className="bookings-content">
            <h2>Lịch sử đặt xe của bạn</h2>

            <div className="filter-controls">
              <label htmlFor="statusFilter">Lọc theo trạng thái:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="pending">Đang chờ xử lý</option>
                <option value="deposit_paid">Đã thanh toán tiền giữ chỗ</option>
                <option value="fully_paid">Đã thanh toán toàn bộ</option>
                <option value="in_progress">Đang thuê xe</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="canceled">Đã huỷ</option>
                <option value="refunded">Đã hoàn tiền</option>
                <option value="rejected">Bị từ chối</option>
                <option value="cancel_requested">Đang chờ huỷ</option>
              </select>
            </div>

            {bookings.length === 0 ? (
              <p className="no-bookings-message">Bạn chưa có đơn đặt xe nào.</p>
            ) : (
              <div className="bookings-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Xe</th>
                      <th>Ngày nhận</th>
                      <th>Ngày trả</th>
                      <th>Tổng tiền</th>
                      <th>Đã thanh toán</th>
                      <th>Còn lại</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const { totalPaid, remainingAmount, totalRefund } = calculatePaymentDetails(booking);
                      
                      return (
                        <React.Fragment key={booking._id}>
                          <tr>
                            <td>#{booking._id.slice(-4)}</td>
                            <td>
                              <div className="vehicle-cell-content">
                                <div className="vehicle-details-text">
                                  <p className="vehicle-name-in-table">
                                    {booking.vehicle?.brand} {booking.vehicle?.model || 'Xe không xác định'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>{moment(booking.startDate).format('DD/MM/YYYY HH:mm')}</td>
                            <td>{moment(booking.endDate).format('DD/MM/YYYY HH:mm')}</td>
                            <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</td>
                            <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}</td>
                            <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button 
                                  className="view-details-button"
                                  onClick={() => navigate(`/bookings/${booking._id}`)}
                                >
                                  <FaInfoCircle /> Xem chi tiết
                                </button>
                                <button
                                  className="view-contract-button"
                                  style={{ marginLeft: 8, background: '#1976d2', color: '#fff', borderRadius: 6, padding: '6px 14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
                                  onClick={() => navigate(`/contracts/${booking._id}`)}
                                >
                                  Xem hợp đồng
                                </button>
                                {booking.status === 'DEPOSIT_PAID' && remainingAmount > 0 && (
                                  <button 
                                    className="pay-remaining-button"
                                    onClick={() => navigate(`/payment-remaining/${booking._id}`)}
                                  >
                                    <FaCreditCard /> Thanh toán
                                  </button>
                                )}
                                { booking.status =='completed' && !booking.rating && !booking.review && (
                                  <button
                                    className="review-button"
                                    onClick={() => handleOpenReview(booking._id)}
                                  >
                                    Đánh giá
                                  </button>
                                )}
                                {/* Nút huỷ booking */}
                                {(booking.status === 'pending' || booking.status === 'deposit_paid' || booking.status === 'fully_paid') && 
                                 booking.status !== 'cancel_requested' && 
                                 new Date(booking.startDate) > new Date() && (
                                  <button
                                     className="cancel-button"
                                     style={{ marginLeft: 8, background: '#dc3545', color: '#fff', borderRadius: 6, padding: '6px 14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
                                     onClick={() => handleOpenCancel(booking._id)}
                                   >
                                     <FaTimesCircle style={{ marginRight: 4 }} /> Huỷ đơn
                                   </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {totalRefund > 0 && (
                            <tr>
                              <td colSpan={9}>
                                <div className="refund-note" style={{ color: '#2563eb', background: '#f1f5f9', borderRadius: 6, padding: '6px 12px', margin: '4px 0', fontSize: 15 }}>
                                  Đã hoàn tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRefund)} về ví của bạn.
                                </div>
                              </td>
                            </tr>
                          )}
                          {(booking.totalRefundForRenterCancel > 0 || booking.totalRefundForOwnerCancel > 0) && booking.status === 'canceled' && (
                            <tr>
                              <td colSpan={9}>
                                <div className="cancel-refund-info" style={{ color: '#059669', background: '#f0fdf4', borderRadius: 6, padding: '8px 12px', margin: '4px 0', fontSize: 15, border: '1px solid #bbf7d0' }}>
                                  <div><strong>Thông tin hoàn tiền sau huỷ:</strong></div>
                                  {booking.totalRefundForRenterCancel > 0 && (
                                    <div>• Hoàn cho bạn: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalRefundForRenterCancel)}</div>
                                  )}
                                  {booking.totalRefundForOwnerCancel > 0 && (
                                    <div>• Bồi thường chủ xe: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalRefundForOwnerCancel)}</div>
                                  )}
                                  <div style={{ fontSize: 13, color: '#065f46', marginTop: 4 }}>Trạng thái: {booking.refundStatusRenter === 'approved' ? 'Đã chuyển tiền' : 'Đang chờ admin duyệt chuyển tiền'}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Review Modal Popup */}
      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <button className="review-modal-close" onClick={handleCloseReview}>×</button>
            <h3>Đánh giá chuyến đi</h3>
            <div className="review-stars">
              {[1,2,3,4,5].map((star) => (
                <FaStar
                  key={star}
                  size={28}
                  style={{ cursor: 'pointer', marginRight: 4 }}
                  color={star <= reviewStars ? '#fbbf24' : '#e5e7eb'}
                  onClick={() => setReviewStars(star)}
                />
              ))}
            </div>
            <textarea
              className="review-textarea"
              rows={4}
              placeholder="Hãy chia sẻ trải nghiệm của bạn..."
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
              disabled={reviewSubmitting}
            />
            <div className="review-modal-actions">
              <button className="review-submit-btn" onClick={handleSubmitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button className="review-cancel-btn" onClick={handleCloseReview} disabled={reviewSubmitting}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h3 style={{ margin: 0, color: '#dc3545' }}>Huỷ đặt xe</h3>
              <button
                onClick={handleCloseCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Lý do huỷ đơn <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do huỷ đơn..."
                  rows={4}
                  style={{
                    width: '100%',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: 10,
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>
              {cancelError && (
                <div style={{ color: 'red', fontSize: 14, marginBottom: 16 }}>
                  {cancelError}
                </div>
              )}
              <div style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
                <strong>Lưu ý:</strong> Yêu cầu huỷ sẽ được gửi đến chủ xe để duyệt. Số tiền hoàn lại sẽ phụ thuộc vào chính sách hoàn tiền và thời gian huỷ.
              </div>
            </div>
            <div className="modal-footer" style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseCancel}
                disabled={cancelSubmitting}
                style={{
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Đóng
              </button>
              <button
                onClick={handleSubmitCancel}
                disabled={cancelSubmitting || !cancelReason.trim()}
                style={{
                  background: cancelSubmitting ? '#ccc' : '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  cursor: cancelSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {cancelSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu huỷ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
};

export default UserBookings;