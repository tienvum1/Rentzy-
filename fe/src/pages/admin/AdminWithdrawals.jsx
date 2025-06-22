import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaCheck, FaTimes, FaEye, FaSpinner } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin';
import './AdminWithdrawals.css';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingWithdrawals();
  }, []);

  const fetchPendingWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/pending-withdrawals`,
        { withCredentials: true }
      );
      setWithdrawals(response.data.withdrawals);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu rút tiền');
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/withdraw/${transactionId}`,
        { action: 'approve' },
        { withCredentials: true }
      );
      
      // Refresh danh sách
      await fetchPendingWithdrawals();
      alert('Đã duyệt yêu cầu rút tiền thành công!');
    } catch (err) {
      alert('Lỗi khi duyệt yêu cầu: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transactionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu rút tiền này?')) {
      return;
    }

    try {
      setProcessingId(transactionId);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/withdraw/${transactionId}`,
        { action: 'reject' },
        { withCredentials: true }
      );
      
      // Refresh danh sách
      await fetchPendingWithdrawals();
      alert('Đã từ chối yêu cầu rút tiền!');
    } catch (err) {
      alert('Lỗi khi từ chối yêu cầu: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="admin-page-container">
          <SidebarAdmin />
          <main className="admin-main-content">
            <div className="loading-container">
              <FaSpinner className="loading-spinner" />
              <p>Đang tải danh sách yêu cầu rút tiền...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="admin-page-container">
        <SidebarAdmin />
        <main className="admin-main-content">
          <div className="withdrawals-container">
            <div className="page-header">
              <h2>Quản lý yêu cầu rút tiền</h2>
              <button 
                className="refresh-btn"
                onClick={fetchPendingWithdrawals}
                disabled={loading}
              >
                <FaSpinner className={loading ? 'spinning' : ''} />
                Làm mới
              </button>
            </div>

            {error && (
              <div className="error-message">
                <FaTimes />
                {error}
              </div>
            )}

            {withdrawals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>Không có yêu cầu rút tiền nào</h3>
                <p>Tất cả yêu cầu rút tiền đã được xử lý.</p>
              </div>
            ) : (
              <div className="withdrawals-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Số tiền</th>
                      <th>Thông tin ngân hàng</th>
                      <th>Thời gian yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-name">
                              {withdrawal.wallet?.user?.name || 'Không có tên'}
                            </div>
                            <div className="user-email">
                              {withdrawal.wallet?.user?.email || 'Không có email'}
                            </div>
                            <div className="user-phone">
                              {withdrawal.wallet?.user?.phone || 'Không có số điện thoại'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="amount-cell">
                            <span className="amount">{formatAmount(withdrawal.amount)}</span>
                            <div className="wallet-balance">
                              Số dư: {formatAmount(withdrawal.wallet?.balance || 0)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="bank-info">
                            <div><strong>Chủ TK:</strong> {withdrawal.paymentMetadata?.accountName}</div>
                            <div><strong>Số TK:</strong> {withdrawal.paymentMetadata?.accountNumber}</div>
                            <div><strong>Ngân hàng:</strong> {withdrawal.paymentMetadata?.bankName}</div>
                          </div>
                        </td>
                        <td>
                          <div className="time-info">
                            <div className="request-date">
                              {moment(withdrawal.createdAt).format('DD/MM/YYYY')}
                            </div>
                            <div className="request-time">
                              {moment(withdrawal.createdAt).format('HH:mm')}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge pending">
                            Chờ duyệt
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(withdrawal._id)}
                              disabled={processingId === withdrawal._id}
                            >
                              {processingId === withdrawal._id ? (
                                <FaSpinner className="spinning" />
                              ) : (
                                <FaCheck />
                              )}
                              Duyệt
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(withdrawal._id)}
                              disabled={processingId === withdrawal._id}
                            >
                              {processingId === withdrawal._id ? (
                                <FaSpinner className="spinning" />
                              ) : (
                                <FaTimes />
                              )}
                              Từ chối
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
        </main>
      </div>
    </>
  );
};

export default AdminWithdrawals; 