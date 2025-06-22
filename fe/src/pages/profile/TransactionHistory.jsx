import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = { withCredentials: true };
        let url = `${process.env.REACT_APP_BACKEND_URL}/api/transactions/my-transactions`;
        if (statusFilter) {
          url += `?status=${statusFilter}`;
        }
        const response = await axios.get(url, config);
        setTransactions(response.data.transactions);
      } catch (err) {
        setError('Không thể tải lịch sử giao dịch.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [statusFilter]);

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ xử lý';
      case 'COMPLETED': return 'Hoàn thành';
      case 'FAILED': return 'Thất bại';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'COMPLETED': return 'completed';
      case 'FAILED': return 'failed';
      case 'CANCELED': return 'canceled';
      default: return '';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'Tiền giữ chỗ';
      case 'RENTAL': return 'Tiền thuê xe';
      case 'REFUND': return 'Hoàn tiền';
      default: return type;
    }
  };

  return (
    <main className="profile-main-content">
      <div className="transaction-history-container">
        <h2>Lịch sử giao dịch</h2>
        <div className="filter-controls">
          <label htmlFor="statusFilter">Lọc theo trạng thái:</label>
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
          </select>
        </div>
        {loading ? (
          <div className="wallet-loading">Đang tải...</div>
        ) : error ? (
          <div className="wallet-error">{error}</div>
        ) : transactions.length === 0 ? (
          <p>Bạn chưa có giao dịch nào.</p>
        ) : (
          <div className="transactions-table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã giao dịch</th>
                  <th>Loại giao dịch</th>
                  <th>Xe</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{transaction._id}</td>
                    <td>{getTransactionTypeText(transaction.type)}</td>
                    <td>
                      {transaction.booking?.vehicle ? (
                        <div className="vehicle-cell-content">
                         
                          <div className="vehicle-details-text">
                            <p className="vehicle-name-in-table">
                          {transaction.booking.vehicle.model}
                            </p>
                          
                          </div>
                        </div>
                      ) : (
                        'Không có thông tin xe'
                      )}
                    </td>
                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}</td>
                    <td>{transaction.paymentMethod}</td>
                    <td>
                      <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td>{moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                    <td>
                      {transaction.booking?._id && (
                        <div className="actions-cell">
                          <button
                            className="view-details-button"
                            onClick={() => navigate(`/bookings/${transaction.booking._id}`)}
                          >
                            <FaInfoCircle /> Xem chi tiết
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default TransactionHistory; 