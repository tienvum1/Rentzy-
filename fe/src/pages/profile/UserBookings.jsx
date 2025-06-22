import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import './UserBookings.css';

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
        return 'Đang chờ xử lý';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'DEPOSIT_PAID':
        return 'Đã thanh toán tiền giữ chỗ';
      case 'RENTAL_PAID':
        return 'Đã thanh toán đầy đủ';
      case 'IN_PROGRESS':
        return 'Đang sử dụng';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELED':
        return 'Đã hủy';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'EXPIRED':
        return 'Đã hết hạn';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const calculatePaymentDetails = (booking) => {
    const totalPaid = booking.transactions.reduce((sum, transaction) => {
      if (transaction.status === 'COMPLETED') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);

    const remainingAmount = booking.status === 'RENTAL_PAID' ? 0 : booking.totalAmount - totalPaid;

    return {
      totalPaid,
      remainingAmount
    };
  };

  if (loading) {
    return (
      <div className="user-bookings-container">
        <div className="loading-message">Đang tải danh sách đặt xe...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-bookings-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
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
            <option value="PENDING">Đang chờ xử lý</option>
            <option value="DEPOSIT_PAID">Đã thanh toán tiền giữ chỗ</option>
            <option value="RENTAL_PAID">Đã thanh toán đầy đủ</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="IN_PROGRESS">Đang sử dụng</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELED">Đã hủy</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="EXPIRED">Đã hết hạn</option>
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
                  const { totalPaid, remainingAmount } = calculatePaymentDetails(booking);
                  
                  return (
                    <tr key={booking._id}>
                      <td>
                        <div className="vehicle-cell-content">
                          {booking.vehicle?.primaryImage ? (
                            <img 
                              src={booking.vehicle.primaryImage} 
                              alt={`${booking.vehicle.brand} ${booking.vehicle.model}`} 
                              className="vehicle-thumbnail" 
                            />
                          ) : (
                            <div className="no-image-thumbnail">No Image</div>
                          )}
                          <div className="vehicle-details-text">
                            <p className="vehicle-name-in-table">
                              {booking.vehicle?.brand} {booking.vehicle?.model || 'Xe không xác định'}
                            </p>
                            <p className="booking-dates">
                              <FaCalendarAlt /> {moment(booking.startDate).format('DD/MM/YYYY')} - {moment(booking.endDate).format('DD/MM/YYYY')}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookings; 