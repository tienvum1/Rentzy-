import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import './UserBookings.css';
import ProfileLayout from '../profileLayout/ProfileLayout';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

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
      case 'PENDING':
      case 'pending':
        return 'Đang chờ xử lý';
      case 'CONFIRMED':
      case 'confirmed':
        return 'Đã xác nhận';
      case 'DEPOSIT_PAID':
      case 'deposit_paid':
        return 'Đã thanh toán tiền giữ chỗ';
      case 'RENTAL_PAID':
      case 'rental_paid':
      case 'FULLY_PAID':
      case 'fully_paid':
        return 'Đã thanh toán đầy đủ';
      case 'IN_PROGRESS':
      case 'in_progress':
        return 'Đang sử dụng';
      case 'COMPLETED':
      case 'completed':
        return 'Đã hoàn thành';
      case 'CANCELED':
      case 'canceled':
        return 'Đã hủy';
      case 'REJECTED':
      case 'rejected':
        return 'Đã từ chối';
      case 'EXPIRED':
      case 'expired':
        return 'Đã hết hạn';
      case 'REFUNDED':
      case 'refunded':
        return 'Đã hoàn tiền';
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

  return (
    <ProfileLayout>
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
                <option value="fully_paid">Đã thanh toán đầy đủ</option>
                <option value="in_progress">Đang sử dụng</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="canceled">Đã hủy</option>
                <option value="rejected">Đã từ chối</option>
                <option value="expired">Đã hết hạn</option>
                <option value="refunded">Đã hoàn tiền</option>
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
    </ProfileLayout>
  );
};

export default UserBookings; 