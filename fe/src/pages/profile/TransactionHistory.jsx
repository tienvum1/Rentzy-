import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import ProfileSidebar from './ProfileSidebar';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const config = {
        withCredentials: true,
      };

      let url = `${process.env.REACT_APP_BACKEND_URL}/api/transactions/my-transactions`;
      const params = new URLSearchParams();

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await axios.get(`${url}?${params.toString()}`, config);
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'COMPLETED':
        return 'completed';
      case 'FAILED':
        return 'failed';
      case 'CANCELED':
        return 'canceled';
      default:
        return '';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Tiền giữ chỗ';
      case 'RENTAL':
        return 'Tiền thuê xe';
      case 'REFUND':
        return 'Hoàn tiền';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="transaction-history-container">Đang tải...</div>;
  }

  return (
    <>  <Header />
    <div className="profile-page">
  
      <div className="profile-container">
        <ProfileSidebar />
        <div className="profile-content">
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

            {transactions.length === 0 ? (
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
                              {transaction.booking.vehicle.primaryImage ? (
                                <img 
                                  src={transaction.booking.vehicle.primaryImage} 
                                  alt={`${transaction.booking.vehicle.brand} ${transaction.booking.vehicle.model}`} 
                                  className="vehicle-thumbnail" 
                                />
                              ) : (
                                <div className="no-image-thumbnail">No Image</div>
                              )}
                              <div className="vehicle-details-text">
                                <p className="vehicle-name-in-table">
                                  {transaction.booking.vehicle.brand} {transaction.booking.vehicle.model}
                                </p>
                                <p className="booking-dates">
                                  <FaCalendarAlt /> {moment(transaction.booking.startDate).format('DD/MM/YYYY')} - {moment(transaction.booking.endDate).format('DD/MM/YYYY')}
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
                          <div className="actions-cell">
                            <button 
                              className="view-details-button"
                              onClick={() => navigate(`/bookings/${transaction.booking._id}`)}
                            >
                              <FaInfoCircle /> Xem chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TransactionHistory; 