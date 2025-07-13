import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './AdminPayoutRequests.css';

const AdminDepositRefunds = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/deposit-refund-requests`, { withCredentials: true });
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Không thể tải danh sách hoàn cọc.');
    }
    setLoading(false);
  };

  const handleApproveDeposit = async (bookingId) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: 'deposit' }));
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/approve-deposit-refund/${bookingId}`, {}, { withCredentials: true });
      setRequests(prev => prev.map(r => r.id === bookingId ? { ...r, depositRefundStatus: 'approved' } : r));
    } catch (err) {
      alert('Duyệt hoàn cọc thất bại!');
    }
    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const calcDepositRefund = (r) => {
    const deposit = r.vehicle?.deposit || 0;
    return deposit;
  };

  // Only keep deposit refund requests
  const depositRefundRequests = requests.filter(r => (r.vehicle?.deposit || 0) > 0 && r.depositRefundStatus !== 'approved');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <SidebarAdmin />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="admin-payout-requests-container">
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Duyệt hoàn tiền cọc cho người thuê</h2>
          {loading ? (
            <div className="apr-loading">Đang tải...</div>
          ) : error ? (
            <div className="apr-error">{error}</div>
          ) : depositRefundRequests.length === 0 ? (
            <div className="apr-empty">Không có yêu cầu hoàn cọc nào cần duyệt.</div>
          ) : (
            <div className="apr-table-wrapper">
              <table className="apr-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Chủ xe</th>
                    <th>Người thuê</th>
                    <th>Xe</th>
                    <th>Tổng tiền thuê</th>
                    <th>Hoàn cọc cho người thuê (100%)</th>
                    <th>Trạng thái hoàn cọc</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {depositRefundRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.id.slice(-6).toUpperCase()}</td>
                      <td>{r.owner?.name || r.owner?.email}</td>
                      <td>{r.renter?.name || r.renter?.email}</td>
                      <td>{r.vehicle?.brand} {r.vehicle?.model}</td>
                      <td>{r.totalAmount?.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ color: '#388e3c', fontWeight: 600 }}>{calcDepositRefund(r).toLocaleString('vi-VN')} ₫</td>
                      <td>
                        {r.depositRefundStatus === 'approved' ? (
                          <span className="apr-status apr-status-approved">Đã hoàn cọc</span>
                        ) : (
                          <span className="apr-status apr-status-pending">Chờ duyệt</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="apr-approve-btn"
                          disabled={r.depositRefundStatus === 'approved' || actionLoading[r.id] === 'deposit'}
                          onClick={() => handleApproveDeposit(r.id)}
                        >
                          {actionLoading[r.id] === 'deposit' ? 'Đang hoàn cọc...' : (r.depositRefundStatus === 'approved' ? 'Đã hoàn cọc' : 'Duyệt hoàn cọc')}
                        </button>
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
  );
};

export default AdminDepositRefunds; 