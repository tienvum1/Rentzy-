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

const BookingDetailsPage = () => {
  const { id } = useParams(); // Get booking ID from URL
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carId, setCarId] = useState(null);

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
    // Tính tổng số tiền đã thanh toán từ các giao dịch COMPLETED
    const totalPaid = booking.transactions.reduce((sum, transaction) => {
      if (transaction.status === 'COMPLETED') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);

    // Nếu đã thanh toán đầy đủ (RENTAL_PAID)
    if (booking.status === 'RENTAL_PAID') {
      return {
        totalPaid: totalPaid,
        remaining: 0,
        showPaymentButton: false,
        showReservationRefund: false,
        reservationRefund: 0
      };
    }

    // Nếu chỉ thanh toán tiền giữ chỗ (DEPOSIT_PAID)
    if (booking.status === 'DEPOSIT_PAID' || booking.status === 'deposit_paid') {
      // Số tiền còn lại phải trả = Tổng tiền - Số tiền đã thanh toán
      const remaining = booking.totalAmount - totalPaid;
      return {
        totalPaid: totalPaid,
        remaining: remaining,
        showPaymentButton: remaining > 0,
        showReservationRefund: true,
        nextPaymentAmount: remaining,
        reservationRefund: booking.reservationFee || 0 // Hoàn tiền giữ chỗ đúng bằng reservationFee
      };
    }

    // Nếu chưa thanh toán (PENDING)
    if (booking.status === 'pending') {
      const remaining = booking.totalAmount - totalPaid;
      return {
        totalPaid: totalPaid,
        remaining: remaining,
        showPaymentButton: false,
        showReservationRefund: false,
        nextPaymentAmount: remaining,
        reservationRefund: 0 // Không hoàn tiền giữ chỗ
      };
    }

    // Các trường hợp khác
    const remaining = booking.totalAmount - totalPaid;
    return {
      totalPaid: totalPaid,
      remaining: remaining,
      showPaymentButton: booking.status === 'DEPOSIT_PAID' && remaining > 0,
      showReservationRefund: true,
      nextPaymentAmount: remaining,
      reservationRefund: booking.reservationFee || 0
    };
  };

  const { totalPaid, remaining, showPaymentButton, showReservationRefund, nextPaymentAmount, reservationRefund } = calculatePaymentDetails();

  // Hàm huỷ đặt xe với hoàn tiền
  const handleCancelBooking = async () => {
    try {
      // Lấy thông tin hoàn tiền dự kiến từ backend
      const config = { withCredentials: true };
      const refundRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/expected-refund`, 
        config
      );

      if (!refundRes.data.success) {
        toast.error(refundRes.data.message || 'Không thể lấy thông tin hoàn tiền');
        return;
      }

      const { 
        canCancel, 
        daysUntilStart, 
        totalPaid, 
        reservationRefund, 
        remainingRefund, 
        totalRefund,
        refundPolicy 
      } = refundRes.data.data;

      if (!canCancel) {
        toast.error('Không thể hủy đơn đã bắt đầu!');
        return;
      }

      // Tạo thông báo hoàn tiền
      let refundMessage = '';
      if (totalRefund > 0) {
        if (reservationRefund > 0 && remainingRefund > 0) {
          refundMessage = `Sẽ hoàn tiền cọc: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(reservationRefund)} và hoàn phần còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingRefund)}`;
        } else if (reservationRefund > 0) {
          refundMessage = `Sẽ hoàn tiền cọc: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(reservationRefund)}`;
        } else if (remainingRefund > 0) {
          refundMessage = `Sẽ hoàn phần còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingRefund)}`;
        }
      } else {
        refundMessage = 'Không hoàn tiền';
      }

      confirmAlert({
        title: 'Xác nhận huỷ đơn đặt xe',
        message: (
          <div>
            <p>Bạn có chắc chắn muốn huỷ đơn đặt xe này không?</p>
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}>
              <p><strong>Thông tin hoàn tiền:</strong></p>
              <p>{refundMessage}</p>
              <p><strong>Tổng hoàn:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRefund)}</p>
              <p><strong>Thời gian còn lại:</strong> {daysUntilStart} ngày</p>
              <p><strong>Trạng thái hiện tại:</strong> {getStatusText(booking.status)}</p>
              <p><strong>Số tiền đã thanh toán:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}</p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <p><strong>Chính sách hoàn tiền:</strong></p>
                <p>• Tiền cọc: {refundPolicy.deposit_paid.over_10_days} (trên 10 ngày), {refundPolicy.deposit_paid.over_5_days} (trên 5 ngày), {refundPolicy.deposit_paid.under_5_days} (dưới 5 ngày)</p>
                <p>• Đã thanh toán toàn bộ: {refundPolicy.confirmed}</p>
                <p>• Chưa thanh toán: {refundPolicy.pending}</p>
              </div>
            </div>
          </div>
        ),
        buttons: [
          {
            label: 'Đồng ý hủy',
            onClick: async () => {
              try {
                // Hiển thị loading
                toast.info('Đang xử lý hủy đơn...');
                
                const cancelRes = await axios.post(
                  `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${booking._id}/cancel-with-refund`, 
                  { reason: 'User canceled' }, 
                  config
                );

                if (cancelRes.data.success) {
                  // Hiển thị thông báo thành công với chi tiết hoàn tiền
                  const { reservationRefund: actualReservationRefund, remainingRefund: actualRemainingRefund, totalRefund: actualTotalRefund, newWalletBalance } = cancelRes.data.data;
                  
                  let successMessage = 'Hủy đơn thành công!\n';
                  if (actualReservationRefund > 0) {
                    successMessage += `• Hoàn tiền cọc: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(actualReservationRefund)}\n`;
                  }
                  if (actualRemainingRefund > 0) {
                    successMessage += `• Hoàn phần còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(actualRemainingRefund)}\n`;
                  }
                  successMessage += `• Tổng hoàn: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(actualTotalRefund)}\n`;
                  successMessage += `• Số dư ví mới: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newWalletBalance)}`;

                  toast.success(successMessage);
                  
                  // Chuyển hướng sau 2 giây
                  setTimeout(() => {
                    navigate('/profile/my-bookings');
                  }, 2000);
                } else {
                  toast.error(cancelRes.data.message || 'Hủy đơn thất bại!');
                }
              } catch (err) {
                console.error('Error canceling booking:', err);
                const errorMessage = err.response?.data?.message || 'Hủy đơn thất bại!';
                toast.error(errorMessage);
              }
            }
          },
          {
            label: 'Không hủy',
            onClick: () => {
              toast.info('Đã hủy thao tác');
            }
          }
        ],
        closeOnEscape: true,
        closeOnClickOutside: true,
      });

    } catch (err) {
      console.error('Error getting expected refund:', err);
      const errorMessage = err.response?.data?.message || 'Không thể lấy thông tin hoàn tiền!';
      toast.error(errorMessage);
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
          <div className="payment-row">
            <span className="payment-label">Tiền giữ chỗ:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.reservationFee)}</span>
          </div>
          <div className="payment-row total">
            <span className="payment-label">Tổng tiền đơn hàng:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</span>
          </div>
          <div className="payment-row paid">
              <span className="payment-label">Hoàn tiền giữ chỗ:</span>
              <span className="payment-value">- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(reservationRefund)}</span>
            </div>
          <div className="payment-row paid">
            <span className="payment-label">Đã thanh toán:</span>
            <span className="payment-value">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}</span>
          </div>
     
           
  
          <div className="payment-row remaining">
            <span className="payment-label">Còn lại phải trả:</span>
            <span className="payment-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining - totalPaid)}</span>
          </div>
          
          {showPaymentButton && (
            <div className="payment-action">
              <button 
                className="pay-remaining-details-button"
                onClick={() => navigate(`/payment-remaining/${booking._id}`)}
              >
                <FaCreditCard /> Thanh toán phần còn lại ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining - totalPaid)})
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
                           startDate > now;
          
          if (canCancel) {
            return (
              <button
                className="cancel-booking-button"
                onClick={handleCancelBooking}
              >
                <FaTimesCircle style={{ marginRight: 8, fontSize: 18 }} />
                Huỷ đặt xe
              </button>
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