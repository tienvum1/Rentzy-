import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './OwnerRequestsPage.css';
import './AdminDashboard.css';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin';

const OwnerRequestsPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [rejectionReason, setRejectionReason] = useState({});
  const [modalImage, setModalImage] = useState(null);

  const { user } = useAuth();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user || !user.role || !user.role.includes('admin')) {
        setError('Bạn không có quyền truy cập trang này.');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${backendUrl}/api/admin/owner/pendingRequests`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setPendingRequests(response.data.data);
      } else {
        setError(response.data.message || 'Lỗi khi lấy danh sách yêu cầu chờ duyệt.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối server khi lấy danh sách.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId, status) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    setError('');
    setRejectionReason(prev => ({ ...prev, [userId]: '' }));

    const payload = { status };
    if (status === 'rejected') {
      const reason = rejectionReason[userId] || '';
      if (!reason) {
        setError(`Vui lòng nhập lý do từ chối cho yêu cầu của ${userId}.`);
        setActionLoading(prev => ({ ...prev, [userId]: false }));
        return;
      }
      payload.rejectionReason = reason;
    }

    try {
      const response = await axios.put(`${backendUrl}/api/admin/owner/reviewRequest/${userId}`, payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        setPendingRequests(pendingRequests.filter(req => req._id !== userId));
        alert(response.data.message);
      } else {
        setError(response.data.message || `Lỗi khi duyệt yêu cầu của ${userId}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Lỗi kết nối server khi duyệt yêu cầu của ${userId}.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (user && user.role) {
      if (user.role.includes('admin')) {
        fetchPendingRequests();
      } else {
        setError('Bạn không có quyền truy cập trang này.');
        setLoading(false);
      }
    } else if (user === null) {
      setError('Vui lòng đăng nhập để truy cập trang này.');
      setLoading(false);
    }
  }, [user]);

  const handleReasonChange = (userId, value) => {
    setRejectionReason(prev => ({ ...prev, [userId]: value }));
  };

  const closeModal = () => setModalImage(null);

  if (loading) return <div>Đang tải danh sách yêu cầu...</div>;
  if (error) return <div className="error-message">Lỗi: {error}</div>;
  if (pendingRequests.length === 0) return (
    <div className="admin-dashboard-layout">
      <SidebarAdmin />
      <div className="admin-dashboard-content">
        <div className="owner-requests-content-inner">
          <div className="no-requests-message-container">
            <p>Không có yêu cầu nào đang chờ duyệt lúc này.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-layout">
      <SidebarAdmin />
      <div className="admin-dashboard-content">
        <div className="owner-requests-content-inner">
          <h2>Yêu cầu trở thành Chủ xe đang chờ duyệt</h2>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Số CCCD/CMND</th>
                <th>Ảnh mặt trước CCCD</th>
                <th>Ảnh mặt sau CCCD</th>
                <th>Ngày gửi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(request => (
                <tr key={request._id}>
                  <td>{request.name}</td>
                  <td>{request.email}</td>
                  <td>{request.phone}</td>
                  <td>{request.cccd_number}</td>
                  <td>
                    {request.cccd_front_url ? (
                      <img
                        src={request.cccd_front_url}
                        alt="CCCD mặt trước"
                        className="cccd-image-thumbnail"
                        onClick={() => setModalImage(request.cccd_front_url)}
                      />
                    ) : 'Không có ảnh'}
                  </td>
                  <td>
                    {request.cccd_back_url ? (
                      <img
                        src={request.cccd_back_url}
                        alt="CCCD mặt sau"
                        className="cccd-image-thumbnail"
                        onClick={() => setModalImage(request.cccd_back_url)}
                      />
                    ) : 'Không có ảnh'}
                  </td>
                  <td>{new Date(request.owner_request_submitted_at).toLocaleDateString()}</td>
                  <td>
                    {actionLoading[request._id] ? (
                      'Đang xử lý...'
                    ) : (
                      <>
                        <button
                          onClick={() => handleReview(request._id, 'approved')}
                          className="btn-approve"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleReview(request._id, 'rejected')}
                          className="btn-reject"
                        >
                          Từ chối
                        </button>
                        <input
                          type="text"
                          placeholder="Lý do từ chối (nếu có)"
                          value={rejectionReason[request._id] || ''}
                          onChange={(e) => handleReasonChange(request._id, e.target.value)}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {modalImage && (
            <div className="modal-backdrop" onClick={closeModal}>
              <img src={modalImage} alt="Preview" className="modal-image" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerRequestsPage;