import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaIdCard } from 'react-icons/fa';
import './Profile.css';

const statusMap = {
  approved: { label: 'Đã xác thực', color: '#22c55e', icon: <FaCheckCircle style={{marginRight: 6}} /> },
  pending: { label: 'Chờ duyệt', color: '#f59e42', icon: <FaExclamationCircle style={{marginRight: 6}} /> },
  rejected: { label: 'Bị từ chối', color: '#ef4444', icon: <FaTimesCircle style={{marginRight: 6}} /> },
};

const CCCDPage = () => {
  const { user } = useAuth();
  const cccdNumber = user?.cccd_number || 'Chưa cập nhật';
  const cccdFrontImage = user?.cccd_front_url || '';
  const cccdBackImage = user?.cccd_back_url || '';
  const cccdStatus = user?.owner_request_status || 'pending';
  const cccdRejectReason = user?.cccdRejectReason || '';
  const fullName = user?.name || 'Chưa cập nhật';

  return (
    <div className="cccd-container">
      <h2 className="cccd-title"><FaIdCard style={{marginRight: 8}}/>Căn cước công dân</h2>
      <div className="cccd-status-row">
        <span className="cccd-status-badge" style={{background: statusMap[cccdStatus]?.color+"22", color: statusMap[cccdStatus]?.color}}>
          {statusMap[cccdStatus]?.icon}
          {statusMap[cccdStatus]?.label || 'Chờ duyệt'}
        </span>
      </div>
      <div className="cccd-note-box">
        <b>Lưu ý:</b> Vui lòng cung cấp CCCD chính chủ để trờ thành người cho thuê xe . Thông tin của bạn sẽ được bảo mật tuyệt đối và chỉ phục vụ cho mục đích xác minh trên hệ thống.
      </div>
      <div className="cccd-main-box">
        <div className="cccd-image-col">
          <div className="cccd-image-label">Ảnh mặt trước CCCD</div>
          {cccdFrontImage ? (
            <img src={cccdFrontImage} alt="Ảnh mặt trước CCCD" className="cccd-img" />
          ) : (
            <div className="cccd-img-placeholder">Chưa có ảnh</div>
          )}
          <div className="cccd-image-label" style={{marginTop: 18}}>Ảnh mặt sau CCCD</div>
          {cccdBackImage ? (
            <img src={cccdBackImage} alt="Ảnh mặt sau CCCD" className="cccd-img" />
          ) : (
            <div className="cccd-img-placeholder">Chưa có ảnh</div>
          )}
        </div>
        <div className="cccd-info-col">
          <div className="cccd-info-row">
            <span className="cccd-info-label">Số CCCD:</span>
            <input className="cccd-info-input" value={cccdNumber} readOnly />
          </div>
          <div className="cccd-info-row">
            <span className="cccd-info-label">Họ và tên:</span>
            <input className="cccd-info-input" value={fullName} readOnly />
          </div>
          {cccdStatus === 'rejected' && cccdRejectReason && (
            <div className="cccd-info-row">
              <span className="cccd-info-label">Lý do từ chối:</span>
              <input className="cccd-info-input cccd-reject" value={cccdRejectReason} readOnly />
            </div>
          )}
        </div>
      </div>
      <div className="cccd-why-verify">Vì sao tôi cần xác thực CCCD?</div>
    </div>
  );
};

export default CCCDPage; 