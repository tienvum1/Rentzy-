import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './AdminPayoutRequests.css';

const AdminPayoutRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payout-requests`, { withCredentials: true });
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Không thể tải danh sách giải ngân.');
    }
    setLoading(false);
  };

  const handleApprove = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/approve-payout/${bookingId}`, {}, { withCredentials: true });
      setRequests(prev => prev.filter(r => r.id !== bookingId));
    } catch (err) {
      alert('Duyệt chuyển tiền thất bại!');
    }
    setActionLoading('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <SidebarAdmin />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="admin-payout-requests-container">
          <h2>Duyệt giải ngân cho chủ xe</h2>
          {loading ? (
            <div className="apr-loading">Đang tải...</div>
          ) : error ? (
            <div className="apr-error">{error}</div>
          ) : requests.length === 0 ? (
            <div className="apr-empty">Không có yêu cầu giải ngân nào cần duyệt.</div>
          ) : (
            <div className="apr-table-wrapper">
              <table className="apr-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Chủ xe</th>
                    <th>Xe</th>
                    <th>Tổng tiền thuê</th>
                    <th>Số tiền thực nhận</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>{r.id.slice(-6).toUpperCase()}</td>
                      <td>{r.owner?.name || r.owner?.email}</td>
                      <td>{r.vehicle?.brand} {r.vehicle?.model}</td>
                      <td>{r.totalCost?.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ color: '#1976d2', fontWeight: 600 }}>{r.payoutAmount?.toLocaleString('vi-VN')} ₫</td>
                      <td><span className="apr-status apr-status-pending">Chờ duyệt</span></td>
                      <td>
                        <button
                          className="apr-approve-btn"
                          disabled={actionLoading === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          Duyệt chuyển tiền
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

export default AdminPayoutRequests; 