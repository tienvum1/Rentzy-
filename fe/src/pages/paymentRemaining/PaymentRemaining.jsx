import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import './PaymentRemaining.css';

const PaymentRemaining = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const config = {
          withCredentials: true,
        };
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}`, config);
        setBooking(res.data.booking);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Vui lòng đăng nhập để thanh toán.");
          navigate('/login');
        } else {
          toast.error('Có lỗi xảy ra khi tải thông tin đơn hàng.');
        }
      }
    };

    fetchBookingDetails();
  }, [id, navigate]);

  const handlePayment = async () => {
    try {
      const config = {
        withCredentials: true,
      };
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/momo/rental-payment`,
        { 
          bookingId: id,
          amount: remainingAmount - booking.reservationFee,
          orderInfo: `Thanh toán tiền thuê xe cho đơn hàng ${booking._id}`
        },
        config
      );

      if (response.data.paymentUrl) {
        const paymentWindow = window.open(response.data.paymentUrl, '_blank');
        
        const checkPaymentStatus = async () => {
          try {
            const statusResponse = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/api/momo/check-rental-payment?bookingId=${id}`,
              config
            );
            
            if (statusResponse.data.status === 'COMPLETED') {
              toast.success('Thanh toán thành công!');
              navigate(`/bookings/${id}`);
            } else if (statusResponse.data.status === 'FAILED') {
              toast.error('Thanh toán thất bại. Vui lòng thử lại.');
              paymentWindow.close();
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        };

        const statusInterval = setInterval(checkPaymentStatus, 5000);

        setTimeout(() => {
          clearInterval(statusInterval);
        }, 300000);

      } else {
        toast.error('Không thể tạo URL thanh toán');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
    }
  };

  if (loading) {
    return <div className="payment-container">Đang tải thông tin thanh toán...</div>;
  }

  if (error) {
    return <div className="payment-container error-message">{error}</div>;
  }

  if (!booking) {
    return <div className="payment-container">Không tìm thấy thông tin đơn hàng.</div>;
  }

  const totalPaidAmount = booking.transactions.reduce((sum, transaction) => {
    console.log('Transaction:', transaction);
    if (transaction.status === 'COMPLETED' && transaction.type === 'DEPOSIT') {
      console.log('Adding deposit amount:', transaction.amount);
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  console.log('Total Paid Amount:', totalPaidAmount);
  console.log('Booking Total Amount:', booking.totalAmount);
  console.log('Remaining Amount:', booking.totalAmount - totalPaidAmount);

  const remainingAmount = booking.totalAmount - totalPaidAmount;

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2><FaMoneyBillWave /> Thanh toán phần còn lại</h2>
        
        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Mã đơn hàng:</span>
            <span className="value">{booking._id}</span>
          </div>
          <div className="detail-row">
            <span className="label">Xe:</span>
            <span className="value">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
          </div>
          <div className="detail-row">
            <span className="label">Tổng tiền đơn hàng:</span>
            <span className="value price">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Đã thanh toán (tiền cọc):</span>
            <span className="value price">
              -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaidAmount)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Hoàn trả tiền cọc:</span>
            <span className="value price">
              -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaidAmount)}
            </span>
          </div>
          <div className="detail-row total">
            <span className="label">Số tiền cần thanh toán:</span>
            <span className="value price">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount - totalPaidAmount)}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <button className="pay-button" onClick={handlePayment}>
            <FaCreditCard /> Thanh toán qua MoMo
          </button>
          <button className="cancel-button" onClick={() => navigate(-1)}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentRemaining; 