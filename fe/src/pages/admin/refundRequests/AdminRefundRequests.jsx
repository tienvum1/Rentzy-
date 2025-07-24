import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './AdminRefundRequests.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminRefundRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({}); // { [bookingId]: 'approve' | null }
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/cancel-requests`, { withCredentials: true });
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu hoàn tiền.');
    }
    setLoading(false);
  };

  const handleApproveRefund = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(prev => ({ ...prev, [selectedRequest._id]: 'approve' }));
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${selectedRequest._id}/admin-approve-cancel`, 
        { note },
        { withCredentials: true }
      );
      setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      toast.success('Duyệt chuyển tiền thành công!');
      setShowModal(false);
      setSelectedRequest(null);
      setNote('');
    } catch (err) {
      toast.error('Duyệt chuyển tiền thất bại!');
    }
    setActionLoading(prev => ({ ...prev, [selectedRequest._id]: null }));
  };

  const openApprovalModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setNote('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setNote('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <SidebarAdmin />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="admin-refund-requests">
          <div className="admin-refund-requests__header">
            <h1>Yêu cầu chuyển tiền hoàn trả và bồi thường</h1>
            <p>Quản lý việc chuyển tiền hoàn trả cho người thuê và bồi thường cho chủ xe</p>
          </div>

          {loading && (
            <div className="admin-refund-requests__loading">
              <div className="spinner"></div>
              <p>Đang tải danh sách yêu cầu hoàn tiền...</p>
            </div>
          )}

          {error && (
            <div className="admin-refund-requests__error">
              <p>{error}</p>
              <button onClick={fetchRequests}>Thử lại</button>
            </div>
          )}

          {!loading && !error && (
            <div className="admin-refund-requests__content">
              {requests.length === 0 ? (
                <div className="admin-refund-requests__empty">
                  <p>Không có yêu cầu chuyển tiền nào đang chờ duyệt.</p>
                </div>
              ) : (
                <div className="admin-refund-requests__list">
                  {requests.map((request) => (
                    <div key={request._id} className="refund-request-card">
                      <div className="refund-request-card__header">
                        <div className="refund-request-card__info">
                          <h3>Đơn #{request._id.slice(-6)}</h3>
                          <span className="refund-request-card__date">
                            {formatDate(request.cancelledAt)}
                          </span>
                        </div>
                        <div className="refund-request-card__amount">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="amount" style={{ color: '#1976d2' }}>
                              Hoàn: {request.totalRefundForRenterCancel?.toLocaleString('vi-VN')} VND
                            </span>
                            <span className="amount" style={{ color: '#e53e3e' }}>
                              Bồi thường: {request.totalRefundForOwnerCancel?.toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="refund-request-card__details">
                        <div className="detail-row">
                          <span className="label">Người thuê:</span>
                          <span className="value">
                            {request.renter?.name} ({request.renter?.email})
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Xe:</span>
                          <span className="value">
                            {request.vehicle?.brand} {request.vehicle?.model} - {request.vehicle?.licensePlate}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Chủ xe:</span>
                          <span className="value">
                            {request.vehicle?.owner?.name} ({request.vehicle?.owner?.email})
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Trạng thái đơn:</span>
                          <span className="value status">{request.status}</span>
                        </div>
                      </div>

                      <div className="refund-request-card__actions">
                        <button
                          className="btn btn-approve"
                          onClick={() => openApprovalModal(request)}
                          disabled={actionLoading[request._id] === 'approve'}
                        >
                          {actionLoading[request._id] === 'approve' ? 'Đang duyệt...' : 'Duyệt chuyển tiền'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal duyệt hoàn tiền */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Duyệt chuyển tiền</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="refund-info">
                <p><strong>Đơn:</strong> #{selectedRequest._id.slice(-6)}</p>
                <p><strong>Người thuê:</strong> {selectedRequest.renter?.name}</p>
                <p><strong>Chủ xe:</strong> {selectedRequest.vehicle?.owner?.name}</p>
                <p><strong>Tiền hoàn cho người thuê:</strong> {selectedRequest.totalRefundForRenterCancel?.toLocaleString('vi-VN')} VND</p>
                <p><strong>Tiền bồi thường cho chủ xe:</strong> {selectedRequest.totalRefundForOwnerCancel?.toLocaleString('vi-VN')} VND</p>
              </div>
              <div className="form-group">
                <label htmlFor="note">Ghi chú (tùy chọn):</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho việc duyệt chuyển tiền..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={closeModal}>
                Hủy
              </button>
              <button 
                className="btn btn-approve" 
                onClick={handleApproveRefund}
                disabled={actionLoading[selectedRequest._id] === 'approve'}
              >
                {actionLoading[selectedRequest._id] === 'approve' ? 'Đang duyệt...' : 'Duyệt chuyển tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminRefundRequests;