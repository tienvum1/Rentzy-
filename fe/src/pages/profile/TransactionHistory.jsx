import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCalendarAlt, FaWallet, FaEye } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import ProfileSidebar from './ProfileSidebar';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWalletAndTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Bước 1: Lấy thông tin ví của user
        const walletResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`,
          { withCredentials: true }
        );
        
        const userWallet = walletResponse.data.wallet;
        setWallet(userWallet);

        // Bước 2: Lấy lịch sử giao dịch với cấu trúc mới
        let url = `${process.env.REACT_APP_BACKEND_URL}/api/transactions/history`;
        const params = new URLSearchParams();
        
        if (statusFilter) {
          params.append('status', statusFilter);
        }
        if (typeFilter) {
          params.append('type', typeFilter);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const transactionsResponse = await axios.get(url, { withCredentials: true });
        
        // Cập nhật để xử lý cấu trúc response mới
        const responseData = transactionsResponse.data;
        if (responseData.success && responseData.data && responseData.data.transactions) {
          setTransactions(responseData.data.transactions);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error('Error fetching wallet and transactions:', err);
        setError('Không thể tải lịch sử giao dịch.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAndTransactions();
  }, [statusFilter, typeFilter]);

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ xử lý';
      case 'COMPLETED': return 'Hoàn thành';
      case 'FAILED': return 'Thất bại';
      case 'CANCELED': return 'Đã hủy';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'COMPLETED': return 'completed';
      case 'FAILED': return 'failed';
      case 'CANCELED': return 'canceled';
      case 'REFUNDED': return 'refunded';
      default: return '';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'WALLET_DEPOSIT': return 'Nạp tiền vào ví';
      case 'WALLET_WITHDRAW': return 'Rút tiền từ ví';
      case 'RENTAL': return 'Tiền thuê xe';
      case 'REFUND': return 'Hoàn tiền';
      case 'DEPOSIT': return 'Tiền giữ chỗ';
      case 'PAYMENT': return 'Thanh toán';
      case 'CANCELLATION': return 'Hủy đơn';
      default: return type;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'MOMO': return 'MoMo';
      case 'WALLET': return 'Ví điện tử';
      case 'BANK_TRANSFER': return 'Chuyển khoản';
      case 'CASH': return 'Tiền mặt';
      case 'PAYOS': return 'PayOS';
      case 'CREDIT_CARD': return 'Thẻ tín dụng';
      case 'DEBIT_CARD': return 'Thẻ ghi nợ';
      default: return method;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'WALLET_DEPOSIT': return '💰';
      case 'WALLET_WITHDRAW': return '💸';
      case 'RENTAL': return '🚗';
      case 'REFUND': return '↩️';
      case 'DEPOSIT': return '💳';
      case 'PAYMENT': return '💳';
      case 'CANCELLATION': return '❌';
      default: return '📊';
    }
  };

  // Hàm xác định loại giao dịch (thanh toán hay nhận tiền)
  const isPaymentTransaction = (transaction) => {
    // Các loại giao dịch trừ tiền (hiển thị dấu -)
    const paymentTypes = ['RENTAL', 'DEPOSIT', 'WALLET_WITHDRAW', 'PAYMENT'];
    return paymentTypes.includes(transaction.type);
  };

  // Hàm xác định loại giao dịch nhận tiền (hiển thị dấu +)
  const isIncomeTransaction = (transaction) => {
    // Các loại giao dịch cộng tiền (hiển thị dấu +)
    const incomeTypes = ['WALLET_DEPOSIT', 'REFUND'];
    return incomeTypes.includes(transaction.type);
  };

  // Hàm lấy màu cho số tiền
  const getAmountColor = (transaction) => {
    if (isPaymentTransaction(transaction)) {
      return 'negative'; // Đỏ cho thanh toán
    } else if (isIncomeTransaction(transaction)) {
      return 'positive'; // Xanh cho nhận tiền
    }
    return 'neutral'; // Màu trung tính
  };

  // Hàm lấy dấu cho số tiền
  const getAmountSign = (transaction) => {
    if (isPaymentTransaction(transaction)) {
      return '-';
    } else if (isIncomeTransaction(transaction)) {
      return '+';
    }
    return '';
  };

  const handleViewBooking = (bookingId) => {
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    }
  };



  return (
    <>
      <Header />
      <div className="profile-page-container">
        <ProfileSidebar />
        <main className="profile-main-content">
          <div className="transaction-history-container">
            <div className="transaction-header">
              <h2>Lịch sử giao dịch ví</h2>
              {wallet && (
                <div className="wallet-summary">
                  <FaWallet className="wallet-icon" />
                  <span className="wallet-balance">
                    Số dư: {wallet.balance.toLocaleString('vi-VN')} {wallet.currency}
                  </span>
                </div>
              )}
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="statusFilter">Trạng thái:</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING">Đang chờ xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="CANCELED">Đã hủy</option>
                  <option value="REFUNDED">Đã hoàn tiền</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="typeFilter">Loại giao dịch:</label>
                <select
                  id="typeFilter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="WALLET_DEPOSIT">Nạp tiền</option>
                  <option value="WALLET_WITHDRAW">Rút tiền</option>
                  <option value="RENTAL">Thuê xe</option>
                  <option value="DEPOSIT">Tiền cọc</option>
                  <option value="REFUND">Hoàn tiền</option>
                  <option value="PAYMENT">Thanh toán</option>
                  <option value="CANCELLATION">Hủy đơn</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải lịch sử giao dịch...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Chưa có giao dịch nào</h3>
                <p>Bạn chưa có giao dịch nào trong ví.</p>
              </div>
            ) : (
              <div className="transactions-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Loại giao dịch</th>
                      <th>Số tiền</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>
                          <div className="transaction-type-cell">
                            <span className="transaction-icon">
                              {getTransactionIcon(transaction.type)}
                            </span>
                            <span className="transaction-type-text">
                              {getTransactionTypeText(transaction.type)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`amount ${getAmountColor(transaction)}`}>
                            {getAmountSign(transaction)}
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(transaction.amount)}
                          </span>
                        </td>
                        <td>{getPaymentMethodText(transaction.paymentMethod)}</td>
                        <td>
                          <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                            {getStatusText(transaction.status)}
                          </span>
                        </td>
                        <td>
                          <div className="time-cell">
                            <FaCalendarAlt className="time-icon" />
                            <span>{moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default TransactionHistory; 