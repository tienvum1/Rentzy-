import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './AdminPayoutRequests.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPayoutRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({}); // { [bookingId]: 'payout' | null }

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

  const handleApprovePayout = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt giải ngân cho đơn này?')) return;
    setActionLoading(prev => ({ ...prev, [bookingId]: 'payout' }));
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/approve-payout/${bookingId}`, {}, { withCredentials: true });
      setRequests(prev => prev.map(r => r.id === bookingId ? { ...r, payoutStatus: 'approved' } : r));
      toast.success('Duyệt giải ngân thành công!');
    } catch (err) {
      toast.error('Duyệt giải ngân thất bại!');
    }
    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const handleCancelPayout = async (bookingId) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: 'cancel' }));
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/cancel-payout/${bookingId}`, {}, { withCredentials: true });
      setRequests(prev => prev.filter(r => r.id !== bookingId));
      toast.success('Đã huỷ giải ngân thành công!');
    } catch (err) {
      toast.error('Huỷ giải ngân thất bại!');
    }
    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const calcPayout = (r) => {
    const deposit = r.vehicle?.deposit || 0;
    const total = r.totalAmount || 0;
    const payout = Math.round((total - deposit) * 0.9);
    return payout;
  };

  // Only keep payout requests
  const payoutRequests = requests.filter(r => r.payoutStatus !== 'approved');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <SidebarAdmin />
      <div style={{ flex: 1, minWidth: 0 }}>
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="admin-payout-requests-container">
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Duyệt giải ngân cho chủ xe</h2>
          {loading ? (
            <div className="apr-loading">Đang tải...</div>
          ) : error ? (
            <div className="apr-error">{error}</div>
          ) : payoutRequests.length === 0 ? (
            <div className="apr-empty">Không có yêu cầu giải ngân nào cần duyệt.</div>
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
                    <th>Thực nhận của chủ xe (90% còn lại)</th>
                    <th>Trạng thái giải ngân</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.id.slice(-6).toUpperCase()}</td>
                      <td>{r.owner?.name || r.owner?.email}</td>
                      <td>{r.renter?.name || r.renter?.email}</td>
                      <td>{r.vehicle?.brand} {r.vehicle?.model}</td>
                      <td>{r.totalAmount?.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ color: '#1976d2', fontWeight: 700 }}>{calcPayout(r).toLocaleString('vi-VN')} ₫</td>
                      <td>
                        {r.payoutStatus === 'approved' ? (
                          <span className="apr-status apr-status-approved">Đã giải ngân</span>
                        ) : (
                          <span className="apr-status apr-status-pending">Chờ duyệt</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="apr-approve-btn"
                          disabled={r.payoutStatus === 'approved' || actionLoading[r.id] === 'payout'}
                          onClick={() => handleApprovePayout(r.id)}
                        >
                          {actionLoading[r.id] === 'payout' ? 'Đang giải ngân...' : (r.payoutStatus === 'approved' ? 'Đã giải ngân' : 'Duyệt giải ngân')}
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