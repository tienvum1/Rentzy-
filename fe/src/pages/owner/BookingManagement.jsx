import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/vi';
import { FaInfoCircle, FaTruck, FaHandshake, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';
import './BookingManagement.css';

// Set moment locale to Vietnamese
moment.locale('vi');

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/owner/owner-bookings`;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const res = await axios.get(url, config);
      if (res.data.success) {
        setBookings(res.data.bookings);
        setError(null);
      } else {
        setError(res.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching owner bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để xem quản lý đặt xe.");
        navigate('/login');
      } else {
        toast.error('Có lỗi xảy ra khi tải danh sách đặt xe.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    navigate(`/ownerpage/booking/${booking._id}`);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
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
    const totalPaid = booking.transactions?.reduce((sum, transaction) => {
      if (transaction.status === 'COMPLETED') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0) || 0;

    const remainingAmount = booking.status === 'RENTAL_PAID' ? 0 : booking.totalAmount - totalPaid;

    return {
      totalPaid,
      remainingAmount
    };
  };

  const handleDeliverVehicle = async (bookingId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}/deliver`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Đã cập nhật trạng thái giao xe');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái giao xe');
    }
  };

  const handleCollectVehicle = async (bookingId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}/collect`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Đã cập nhật trạng thái nhận xe');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái nhận xe');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (date) => {
    return moment.utc(date).local().format('DD/MM/YYYY HH:mm');
  };

  const formatTime = (date) => {
    return moment.utc(date).local().format('HH:mm');
  };

  const formatDate = (date) => {
    return moment.utc(date).local().format('DD/MM/YYYY');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="owner-bookings-container">
          <SidebarOwner/>
          <div className="loading-message">Đang tải danh sách đặt xe...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="owner-bookings-container">
          <SidebarOwner />
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="owner-bookings-container">
        <SidebarOwner />
        <div className="bookings-content">
          <h2>Quản lý đặt xe</h2>

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
            <p className="no-bookings-message">Chưa có đơn đặt xe nào.</p>
          ) : (
            <div className="bookings-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Xe</th>
                    <th>Người thuê</th>
                    <th>Địa điểm nhận xe</th>
                    <th>Địa điểm trả xe</th>
                    <th>Ngày nhận</th>
                    <th>Ngày trả</th>
                    <th>Tổng tiền</th>
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
                          <div className="vehicle-info">
                            <p className="vehicle-name">
                        {booking.vehicle?.model}
                            </p>
                           
                          </div>
                        </td>
                        <td>
                          <div className="renter-info">
                            <p className="renter-name">
                              <strong>{booking.renter?.name || 'Chưa có thông tin'}</strong>
                            </p>
                            <p className="renter-phone">
                              {booking.renter?.phone || 'Chưa có số điện thoại'}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="location-info">
                            <p className="location-address">
                              {booking.pickupLocation || 'Chưa có thông tin'}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="location-info">
                            <p className="location-address">
                              {booking.returnLocation || 'Chưa có thông tin'}
                            </p>

                          </div>
                        </td>
                        <td>{formatDateTime(booking.startDate)}</td>
                        <td>{formatDateTime(booking.endDate)}</td>
                        <td>{formatCurrency(booking.totalAmount)}</td>
                        <td>
                          <span className={` ${getStatusClass(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button 
                              className="view-details-button"
                              onClick={() => handleViewDetails(booking)}
                            >
                              <FaInfoCircle /> Chi tiết
                            </button>
                            {booking.status === 'RENTAL_PAID' && booking.deliveryStatus === 'PENDING' && (
                              <button 
                                className="deliver-button"
                                onClick={() => handleDeliverVehicle(booking._id)}
                              >
                                <FaTruck /> Đã giao xe
                              </button>
                            )}
                            {booking.status === 'IN_PROGRESS' && booking.returnStatus === 'RETURNED' && (
                              <button 
                                className="collect-button"
                                onClick={() => handleCollectVehicle(booking._id)}
                              >
                                <FaHandshake /> Đã nhận xe
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

          {/* Modal Chi tiết */}
          {showDetailModal && selectedBooking && (
            <div className="detail-modal-overlay">
              <div className="detail-modal">
                <div className="detail-modal-header">
                  <h3>Chi tiết đơn đặt xe</h3>
                  <button className="close-button" onClick={closeDetailModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="detail-modal-content">
                  <div className="detail-section">
                    <h4>Thông tin xe</h4>
                    <p><strong>Xe:</strong> {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}</p>
                    <p><strong>Biển số:</strong> {selectedBooking.vehicle?.licensePlate || 'Chưa có'}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Thông tin người thuê</h4>
                    <p><strong>Tên:</strong> {selectedBooking.renter?.name}</p>
                    <p><strong>Số điện thoại:</strong> {selectedBooking.renter?.phone}</p>
                    <p><strong>Email:</strong> {selectedBooking.renter?.email}</p>
                    <p><strong>Địa chỉ:</strong> {selectedBooking.renter?.address}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Thông tin đặt xe</h4>
                    <p><strong>Ngày nhận:</strong> {formatDateTime(selectedBooking.startDate)}</p>
                    <p><strong>Ngày trả:</strong> {formatDateTime(selectedBooking.endDate)}</p>
                    <p><strong>Số ngày thuê:</strong> {selectedBooking.totalDays}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Địa điểm</h4>
                    <div className="location-details">
                      <div className="pickup-location">
                        <h5>Địa điểm nhận xe</h5>
                        <p><strong>Địa chỉ:</strong> {selectedBooking.pickupLocation?.address || 'Chưa có thông tin'}</p>
                        <p><strong>Thời gian:</strong> {formatDateTime(selectedBooking.startDate)}</p>
                        {selectedBooking.pickupLocation?.notes && (
                          <p><strong>Ghi chú:</strong> {selectedBooking.pickupLocation.notes}</p>
                        )}
                      </div>
                      <div className="return-location">
                        <h5>Địa điểm trả xe</h5>
                        <p><strong>Địa chỉ:</strong> {selectedBooking.returnLocation?.address || 'Chưa có thông tin'}</p>
                        <p><strong>Thời gian:</strong> {formatDateTime(selectedBooking.endDate)}</p>
                        {selectedBooking.returnLocation?.notes && (
                          <p><strong>Ghi chú:</strong> {selectedBooking.returnLocation.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Thông tin thanh toán</h4>
                    <p><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.totalAmount)}</p>
                    <p><strong>Tiền cọc:</strong> {formatCurrency(selectedBooking.deposit)}</p>
                    <p><strong>Phí đặt xe:</strong> {formatCurrency(selectedBooking.reservationFee)}</p>
                    <p><strong>Phí giao xe:</strong> {formatCurrency(selectedBooking.deliveryFee)}</p>
                    <p><strong>Giảm giá:</strong> {formatCurrency(selectedBooking.discountAmount)}</p>
                    {selectedBooking.promoCode && (
                      <p><strong>Mã giảm giá:</strong> {selectedBooking.promoCode}</p>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>Giao dịch</h4>
                    {selectedBooking.transactions?.map((transaction, index) => (
                      <div key={transaction._id} className="transaction-item">
                        <p><strong>Giao dịch {index + 1}:</strong></p>
                        <p>Số tiền: {formatCurrency(transaction.amount)}</p>
                        <p>Trạng thái: {transaction.status}</p>
                        <p>Phương thức: {transaction.paymentMethod?.name}</p>
                        <p>Thời gian: {formatDateTime(transaction.createdAt)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="detail-section">
                    <h4>Ghi chú</h4>
                    <p>{selectedBooking.note || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingManagement; 