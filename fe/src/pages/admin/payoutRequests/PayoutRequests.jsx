import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './PayoutRequests.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PayoutRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState({ totalPendingPayouts: 0, totalPayoutAmount: 0 });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchRequests();
  }, [pagination.currentPage]);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/payout-requests`,
        { 
          params: { page, limit: 10 },
          withCredentials: true 
        }
      );
      
      setRequests(res.data.data.bookings || []);
      setPagination(res.data.data.pagination);
      setSummary(res.data.data.summary);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu giải ngân.');
      console.error('Error fetching payout requests:', err);
    }
    setLoading(false);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    const bookingId = selectedRequest._id;
    setActionLoading(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/approve-payout/${bookingId}`,
        { note },
        { withCredentials: true }
      );
      
      toast.success('Đã duyệt yêu cầu giải ngân thành công!');
      setShowModal(false);
      setNote('');
      setSelectedRequest(null);
      fetchRequests(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt yêu cầu.');
      console.error('Error approving payout:', err);
    }
    
    setActionLoading(prev => ({ ...prev, [bookingId]: false }));
  };

  const openApprovalModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setNote('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <SidebarAdmin />
        <div className="admin-content">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <div className="admin-content">
        <div className="payout-requests-page">
          <div className="page-header">
            <h1>Quản lý giải ngân cho chủ xe</h1>
            <p>Duyệt các yêu cầu giải ngân sau khi hoàn thành chuyến đi</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Tổng yêu cầu chờ duyệt</h3>
              <p className="summary-number">{summary.totalPendingPayouts}</p>
            </div>
            <div className="summary-card">
              <h3>Tổng số tiền cần giải ngân</h3>
              <p className="summary-amount">{formatCurrency(summary.totalPayoutAmount)}</p>
            </div>
          </div>

          {/* Requests Table */}
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>Mã đơn</th>
                  <th style={{width: '150px'}}>Chủ xe</th>
                  <th style={{width: '180px'}}>Thông tin ngân hàng</th>
                  <th style={{width: '150px'}}>Xe</th>
                  <th style={{width: '120px'}}>Người thuê</th>
                  <th style={{width: '120px'}}>Tổng tiền thuê</th>
                  <th style={{width: '120px'}}>Phí hệ thống (10%)</th>
                  <th style={{width: '120px'}}>Số tiền giải ngân</th>
                  <th style={{width: '120px'}}>Ngày yêu cầu</th>
                  <th style={{width: '100px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">
                      Không có yêu cầu giải ngân nào
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id}>
                      {/* Cột 1: Mã đơn */}
                      <td className="booking-id">
                        #{request._id.slice(-6)}
                      </td>
                      
                      {/* Cột 2: Chủ xe */}
                      <td className="owner-info">
                        <div>
                          <strong>{request.vehicle?.owner?.name || 'N/A'}</strong>
                          <br />
                          <small>{request.vehicle?.owner?.email || 'N/A'}</small>
                        </div>
                      </td>
                      
                      {/* Cột 3: Thông tin ngân hàng */}
                      <td className="bank-info">
                        {request.vehicle?.owner?.bankAccounts?.[0] ? (
                          <div>
                            <strong>{request.vehicle.owner.bankAccounts[0].bankName}</strong>
                            <br />
                            <small>STK: {request.vehicle.owner.bankAccounts[0].accountNumber}</small>
                            <br />
                            <small>Chủ TK: {request.vehicle.owner.bankAccounts[0].accountHolder}</small>
                          </div>
                        ) : (
                          <span className="no-bank-info">Chưa có thông tin ngân hàng</span>
                        )}
                      </td>
                      
                      {/* Cột 4: Xe */}
                      <td className="vehicle-info">
                        <div>
                          <strong>{request.vehicle?.brand} {request.vehicle?.model}</strong>
                          <br />
                          <small>Biển số: {request.vehicle?.licensePlate}</small>
                        </div>
                      </td>
                      
                      {/* Cột 5: Người thuê */}
                      <td className="renter-info">
                        <div>
                          <strong>{request.renter?.name || 'N/A'}</strong>
                          <br />
                          <small>{request.renter?.email || 'N/A'}</small>
                        </div>
                      </td>
                      
                      {/* Cột 6: Tổng tiền thuê */}
                      <td className="total-cost">
                        <strong>{formatCurrency(request.totalCost || 0)}</strong>
                      </td>
                      
                      {/* Cột 7: Phí hệ thống (10%) */}
                      <td className="system-fee">
                        <span style={{color: '#e74c3c'}}>
                          {formatCurrency(request.systemFee || 0)}
                        </span>
                      </td>
                      
                      {/* Cột 8: Số tiền giải ngân */}
                      <td className="payout-amount">
                        <strong style={{color: '#27ae60'}}>
                          {formatCurrency(request.payoutAmount || 0)}
                        </strong>
                      </td>
                      
                      {/* Cột 9: Ngày yêu cầu */}
                      <td className="request-date">
                        {formatDate(request.payoutRequestedAt)}
                      </td>
                      
                      {/* Cột 10: Thao tác */}
                      <td className="actions">
                        <button
                          className="approve-btn"
                          onClick={() => openApprovalModal(request)}
                          disabled={actionLoading[request._id]}
                        >
                          {actionLoading[request._id] ? 'Đang xử lý...' : 'Duyệt'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="pagination-btn"
              >
                Trước
              </button>
              
              <span className="pagination-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </div>

        {/* Approval Modal */}
        {showModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Duyệt yêu cầu giải ngân</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="request-details">
                  <div className="detail-row">
                    <label>Mã đơn:</label>
                    <span>#{selectedRequest._id.slice(-6)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Chủ xe:</label>
                    <span>{selectedRequest.vehicle?.owner?.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Xe:</label>
                    <span>{selectedRequest.vehicle?.brand} {selectedRequest.vehicle?.model}</span>
                  </div>
                  <div className="detail-row">
                    <label>Người thuê:</label>
                    <span>{selectedRequest.renter?.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Tổng tiền thuê:</label>
                    <span>{formatCurrency(selectedRequest.totalCost)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Phí hệ thống (10%):</label>
                    <span>{formatCurrency(selectedRequest.systemFee)}</span>
                  </div>
                  <div className="detail-row highlight">
                    <label>Số tiền giải ngân:</label>
                    <span><strong>{formatCurrency(selectedRequest.payoutAmount)}</strong></span>
                  </div>
                  {selectedRequest.vehicle?.owner?.bankAccounts?.[0] && (
                    <div className="bank-details">
                      <h4>Thông tin ngân hàng:</h4>
                      <div className="detail-row">
                        <label>Ngân hàng:</label>
                        <span>{selectedRequest.vehicle.owner.bankAccounts[0].bankName}</span>
                      </div>
                      <div className="detail-row">
                        <label>Số tài khoản:</label>
                        <span>{selectedRequest.vehicle.owner.bankAccounts[0].accountNumber}</span>
                      </div>
                      <div className="detail-row">
                        <label>Chủ tài khoản:</label>
                        <span>{selectedRequest.vehicle.owner.bankAccounts[0].accountHolder}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="note-section">
                  <label htmlFor="note">Ghi chú (tùy chọn):</label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú cho yêu cầu giải ngân..."
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={handleApproveRequest}
                  disabled={actionLoading[selectedRequest._id]}
                >
                  {actionLoading[selectedRequest._id] ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
};

export default PayoutRequests;