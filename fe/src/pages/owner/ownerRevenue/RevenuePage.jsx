import React from 'react';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import './RevenuePage.css';

const RevenuePage = () => {
  return (
    <div className="revenue-container">
      <SidebarOwner />
      <div className="revenue-content">
        <h1>Doanh thu của bạn</h1>
        <p>Trang này sẽ hiển thị tổng doanh thu, thống kê và các báo cáo liên quan đến chủ xe.</p>
        {/* TODO: Thêm biểu đồ, bảng doanh thu, lọc theo thời gian, v.v. */}
      </div>
    </div>
  );
};

export default RevenuePage; 