import React, { useState, useEffect } from 'react';
import './AdminBankTransferRequests.css';
import { toast } from 'react-toastify';

const AdminBankTransferRequests = () => {
  const [transferRequests, setTransferRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    note: '',
    bankTransferDetails: {
      transferDate: '',
      transferAmount: '',
      transferReference: '',
      bankName: ''
    }
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransferRequests();
  }, [pagination.currentPage]);

  const fetchTransferRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/bank-transfer-requests?page=${pagination.currentPage}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransferRequests(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        toast.error('Không thể tải danh sách yêu cầu chuyển tiền');
      }
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
      toast.error('Lỗi khi tải danh sách yêu cầu chuyển tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = (request) => {
    setSelectedRequest(request);
    setConfirmData({
      note: '',
      bankTransferDetails: {
        transferDate: new Date().toISOString().split('T')[0],
        transferAmount: request.amount.toString(),
        transferReference: '',
        bankName: ''
      }
    });
    setShowConfirmModal(true);
  };

  const submitConfirmTransfer = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/confirm-bank-transfer/${selectedRequest._id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(confirmData)
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowConfirmModal(false);
        setSelectedRequest(null);
        fetchTransferRequests(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể xác nhận chuyển tiền');
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      toast.error('Lỗi khi xác nhận chuyển tiền');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransferTypeText = (type) => {
    return type === 'REFUND' ? 'Hoàn tiền' : 'Bồi thường';
  };

  const getTransferTypeClass = (type) => {
    return type === 'REFUND' ? 'refund' : 'compensation';
  };

  if (loading) {
    return (
      <div className="admin-bank-transfer-requests">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách yêu cầu chuyển tiền...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-bank-transfer-requests">
      <div className="page-header">
        <h1>Yêu cầu chuyển tiền qua ngân hàng</h1>
        <p>Quản lý các yêu cầu chuyển tiền hoàn trả và bồi thường</p>
      </div>

      <div className="requests-stats">
        <div className="stat-card">
          <h3>Tổng yêu cầu</h3>
          <span className="stat-number">{pagination.totalTransactions}</span>
        </div>
      </div>

      <div className="requests-container">
        {transferRequests.length === 0 ? (
          <div className="no-requests">
            <p>Không có yêu cầu chuyển tiền nào đang chờ xử lý</p>
          </div>
        ) : (
          <div className="requests-list">
            {transferRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>{request.user?.name || 'N/A'}</h3>
                    <span className={`transfer-type ${getTransferTypeClass(request.type)}`}>
                      {getTransferTypeText(request.type)}
                    </span>
                  </div>
                  <div className="request-amount">
                    {formatCurrency(request.amount)}
                  </div>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{request.user?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{request.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">{formatDate(request.createdAt)}</span>
                  </div>
                  
                  {request.user?.bankAccounts && request.user.bankAccounts.length > 0 && (
                    <div className="bank-info">
                      <h4>Thông tin ngân hàng:</h4>
                      {request.user.bankAccounts.map((bank, index) => (
                        <div key={index} className="bank-account">
                          <div className="detail-row">
                            <span className="label">Ngân hàng:</span>
                            <span className="value">{bank.bankName}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Số tài khoản:</span>
                            <span className="value">{bank.accountNumber}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Chủ tài khoản:</span>
                            <span className="value">{bank.accountHolder}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {request.booking && (
                    <div className="booking-info">
                      <h4>Thông tin chuyến đi:</h4>
                      <div className="detail-row">
                        <span className="label">Thời gian:</span>
                        <span className="value">
                          {formatDate(request.booking.startDate)} - {formatDate(request.booking.endDate)}
                        </span>
                      </div>
                      {request.booking.vehicle && (
                        <div className="detail-row">
                          <span className="label">Xe:</span>
                          <span className="value">
                            {request.booking.vehicle.brand} {request.booking.vehicle.model} - {request.booking.vehicle.licensePlate}
                          </span>
                        </div>
                      )}
                      {request.booking.cancellationReason && (
                        <div className="detail-row">
                          <span className="label">Lý do hủy:</span>
                          <span className="value">{request.booking.cancellationReason}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button
                    className="btn-confirm"
                    onClick={() => handleConfirmTransfer(request)}
                  >
                    Xác nhận đã chuyển tiền
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={!pagination.hasPrev}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              Trước
            </button>
            <span className="pagination-info">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={!pagination.hasNext}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Confirm Transfer Modal */}
      {showConfirmModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Xác nhận chuyển tiền</h2>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="transfer-summary">
                <h3>Thông tin chuyển tiền</h3>
                <div className="summary-row">
                  <span>Người nhận:</span>
                  <span>{selectedRequest.user?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Loại:</span>
                  <span>{getTransferTypeText(selectedRequest.type)}</span>
                </div>
                <div className="summary-row">
                  <span>Số tiền:</span>
                  <span className="amount">{formatCurrency(selectedRequest.amount)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Ngày chuyển tiền:</label>
                <input
                  type="date"
                  value={confirmData.bankTransferDetails.transferDate}
                  onChange={(e) => setConfirmData(prev => ({
                    ...prev,
                    bankTransferDetails: {
                      ...prev.bankTransferDetails,
                      transferDate: e.target.value
                    }
                  }))}
                />
              </div>

              <div className="form-group">
                <label>Số tiền đã chuyển:</label>
                <input
                  type="number"
                  value={confirmData.bankTransferDetails.transferAmount}
                  onChange={(e) => setConfirmData(prev => ({
                    ...prev,
                    bankTransferDetails: {
                      ...prev.bankTransferDetails,
                      transferAmount: e.target.value
                    }
                  }))}
                />
              </div>

              <div className="form-group">
                <label>Mã giao dịch/Tham chiếu:</label>
                <input
                  type="text"
                  value={confirmData.bankTransferDetails.transferReference}
                  onChange={(e) => setConfirmData(prev => ({
                    ...prev,
                    bankTransferDetails: {
                      ...prev.bankTransferDetails,
                      transferReference: e.target.value
                    }
                  }))}
                  placeholder="Nhập mã giao dịch ngân hàng"
                />
              </div>

              <div className="form-group">
                <label>Ngân hàng chuyển:</label>
                <input
                  type="text"
                  value={confirmData.bankTransferDetails.bankName}
                  onChange={(e) => setConfirmData(prev => ({
                    ...prev,
                    bankTransferDetails: {
                      ...prev.bankTransferDetails,
                      bankName: e.target.value
                    }
                  }))}
                  placeholder="Tên ngân hàng thực hiện chuyển"
                />
              </div>

              <div className="form-group">
                <label>Ghi chú:</label>
                <textarea
                  value={confirmData.note}
                  onChange={(e) => setConfirmData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Ghi chú thêm (tùy chọn)"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className="btn-confirm"
                onClick={submitConfirmTransfer}
                disabled={processing || !confirmData.bankTransferDetails.transferDate || !confirmData.bankTransferDetails.transferAmount}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận đã chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBankTransferRequests;