import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCreditCard, FaStar } from 'react-icons/fa';
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
                                {booking.status === 'DEPOSIT_PAID' && remainingAmount > 0 && (
                                  <button 
                                    className="pay-remaining-button"
                                    onClick={() => navigate(`/payment-remaining/${booking._id}`)}
                                  >
                                    <FaCreditCard /> Thanh toán
                                  </button>
                                )}
                                { booking.status === 'completed' && !booking.rating && !booking.review && (
                                  <button
                                    className="review-button"
                                    onClick={() => handleOpenReview(booking._id)}
                                  >
                                    Đánh giá
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {totalRefund > 0 && (
                            <tr>
                              <td colSpan={8}>
                                <div className="refund-note" style={{ color: '#2563eb', background: '#f1f5f9', borderRadius: 6, padding: '6px 12px', margin: '4px 0', fontSize: 15 }}>
                                  Đã hoàn tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRefund)} về ví của bạn.
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
    </ProfileLayout>
  );
};

export default UserBookings; 