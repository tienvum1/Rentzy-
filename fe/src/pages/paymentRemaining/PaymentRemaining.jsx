import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCreditCard, FaMoneyBillWave, FaWallet } from 'react-icons/fa';
import './PaymentRemaining.css';

const PaymentRemaining = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch wallet information
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`, { withCredentials: true });
        setWallet(res.data.wallet);
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

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
    if (!booking) return;
    
    setIsPaying(true);
    try {
      const config = {
        withCredentials: true,
      };
      
      // Tính toán số tiền cần thanh toán
      const totalPaidAmount = booking.transactions.reduce((sum, transaction) => {
        if (transaction.status === 'COMPLETED' && transaction.type === 'DEPOSIT') {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
      
      const remainingAmount = booking.totalAmount - totalPaidAmount;
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/wallet/rental`,
        { 
          bookingId: id,
          amount: remainingAmount,
        },
        config
      );

      if (response.data.success) {
        toast.success('Thanh toán thành công!');
        // Refresh booking data
        const updatedRes = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}`,
          { withCredentials: true }
        );
        setBooking(updatedRes.data.booking);
        
        // Refresh wallet balance
        const walletRes = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`,
          { withCredentials: true }
        );
        setWallet(walletRes.data.wallet);
        
        navigate(`/bookings/${id}`);
      } else {
        toast.error(response.data.message || 'Thanh toán thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsPaying(false);
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
    if (transaction.status === 'COMPLETED' && transaction.type === 'DEPOSIT') {
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  const remainingAmount = booking.totalAmount - totalPaidAmount;
  const hasInsufficientBalance = wallet && wallet.balance < remainingAmount;

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2><FaMoneyBillWave /> Thanh toán phần còn lại</h2>
        
        {/* Wallet Information */}
        {!walletLoading && wallet && (
          <div className="wallet-info-section">
            <div className="wallet-balance-display">
              <FaWallet className="wallet-icon" />
              <div className="wallet-details">
                <span className="wallet-label">Số dư ví:</span>
                <span className="wallet-amount">{wallet.balance.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
            {hasInsufficientBalance && (
              <div className="insufficient-balance-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">
                  Số dư không đủ. Vui lòng <a href="/profile/wallet" className="navigate-wallet">nạp thêm tiền</a> vào ví.
                </span>
              </div>
            )}
          </div>
        )}
        
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
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount-totalPaidAmount)}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <button 
            className="pay-button" 
            onClick={handlePayment}
            disabled={isPaying || hasInsufficientBalance}
          >
            <FaCreditCard /> 
            {isPaying ? 'Đang xử lý...' : 'Thanh toán bằng ví điện tử'}
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