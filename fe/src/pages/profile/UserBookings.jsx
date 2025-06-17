import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import './UserBookings.css'; // Assuming you'll create this CSS file

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statusFilter, setStatusFilter] = useState(''); // State for status filter

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const config = {
          withCredentials: true,
        };
        let url = `${process.env.REACT_APP_BACKEND_URL}/api/bookings/my-bookings?page=${page}&limit=${limit}`;
        if (statusFilter) {
          url += `&status=${statusFilter}`;
        }
        const res = await axios.get(url, config);
        setBookings(res.data.bookings);
        setTotalPages(res.data.pagination.totalPages);
        setTotalBookings(res.data.pagination.total);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user bookings:', err);
        setError(err.response?.data?.message || 'Failed to fetch bookings');
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Vui lòng đăng nhập để xem lịch sử đặt xe.");
          navigate('/login');
        } else {
          toast.error('Có lỗi xảy ra khi tải danh sách đặt xe.');
        }
      }
    };

    fetchBookings();
  }, [page, limit, statusFilter, navigate]);

  if (loading) {
    return <div className="user-bookings-container">Đang tải danh sách đặt xe...</div>;
  }

  if (error) {
    return <div className="user-bookings-container error-message">{error}</div>;
  }

  return (
    <div className="user-bookings-container">
      <h2>Lịch sử đặt xe của bạn</h2>

      <div className="filter-controls">
        <label htmlFor="statusFilter">Lọc theo trạng thái:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1); // Reset to first page when filter changes
          }}
        >
          <option value="">Tất cả</option>
          <option value="PENDING">Đang chờ xử lý</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="EXPIRED">Đã hết hạn</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <p>Bạn chưa có đơn đặt xe nào.</p>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.vehicle?.name || 'Xe không xác định'}</h3>
                <span className={`booking-status ${booking.status.toLowerCase()}`}>{booking.status}</span>
              </div>
              <div className="booking-details">
                <p><strong>Ngày nhận:</strong> {moment(booking.startDate).format('DD/MM/YYYY HH:mm')}</p>
                <p><strong>Ngày trả:</strong> {moment(booking.endDate).format('DD/MM/YYYY HH:mm')}</p>
                <p><strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</p>
                <p><strong>Chủ xe:</strong> {booking.vehicle?.ownerId?.fullName || 'N/A'}</p>
                {booking.vehicle?.images && booking.vehicle.images.length > 0 && (
                  <img src={booking.vehicle.images[0]} alt={booking.vehicle.name} className="booking-vehicle-image" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalBookings > limit && (
        <div className="pagination-controls">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trang trước
          </button>
          <span>Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default UserBookings; 