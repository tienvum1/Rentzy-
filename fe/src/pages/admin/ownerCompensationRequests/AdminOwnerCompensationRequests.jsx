import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin/SidebarAdmin';
import './AdminOwnerCompensationRequests.css';

const AdminOwnerCompensationRequests = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <SidebarAdmin />
      <div style={{ flex: 1, minWidth: 0, padding: '40px' }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          background: 'white', 
          borderRadius: '12px', 
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '16px' }}>Tính năng đã được cập nhật</h1>
            <p style={{ color: '#7f8c8d', fontSize: '18px', lineHeight: '1.6' }}>
              Việc duyệt bồi thường cho chủ xe đã được tích hợp vào trang 
              <strong> "Yêu cầu chuyển tiền hoàn trả và bồi thường"</strong>.
            </p>
          </div>
          
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#495057', marginBottom: '12px' }}>Quy trình mới:</h3>
            <ol style={{ textAlign: 'left', color: '#6c757d', lineHeight: '1.8' }}>
              <li>Người thuê yêu cầu hủy chuyến</li>
              <li>Chủ xe duyệt yêu cầu hủy</li>
              <li>Admin duyệt chuyển tiền (bao gồm cả hoàn trả và bồi thường)</li>
            </ol>
          </div>
          
          <button 
            onClick={() => navigate('/admin/refund-requests')}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#0056b3'}
            onMouseOut={(e) => e.target.style.background = '#007bff'}
          >
            Đi đến trang duyệt chuyển tiền
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerCompensationRequests;