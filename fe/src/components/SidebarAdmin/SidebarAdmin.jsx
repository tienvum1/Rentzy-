import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
    const navigate = useNavigate();

    const handleMenuItemClick = (path) => {
        navigate(path);
    };

    return (
        <div className="sidebar-admin">
            <div className="sidebar-header">
                <h3>Admin Dashboard</h3>
            </div>
            <ul className="sidebar-menu">
                {/* Dashboard overview */}
                <li onClick={() => handleMenuItemClick('/admin')}>Dashboard</li>

                {/* User management */}
                <li onClick={() => handleMenuItemClick('/admin/users')}>Quản lý người dùng</li>

                {/* Driver License Requests */}
                <li onClick={() => handleMenuItemClick('/admin/driver-license-requests')}>Duyệt GPLX</li>

                {/* Owner Requests */}
                <li onClick={() => handleMenuItemClick('/admin/owner-requests')}>Duyệt chủ xe</li>

                {/* Vehicle Approvals */}
                <li onClick={() => handleMenuItemClick('/admin/vehicle-approvals')}>Duyệt xe</li>

                {/* Vehicle Change Requests */}
                <li onClick={() => handleMenuItemClick('/admin/vehicle-changes')}>Duyệt thay đổi xe</li>

                {/* Withdrawals Management */}
                <li onClick={() => handleMenuItemClick('/admin/withdrawals')}>Quản lý rút tiền</li>

                {/* Payout Requests */}
                <li onClick={() => handleMenuItemClick('/admin/payout-requests')}>Duyệt giải ngân</li>

                {/* Notifications */}
                <li onClick={() => handleMenuItemClick('/admin/notifications')}>Thông báo</li>

                {/* Add more admin tags as needed for your project */}
                {/* Example: Transaction Management, Reports, etc. */}
                {/* <li onClick={() => handleMenuItemClick('/admin/transactions')}>Quản lý giao dịch</li> */}
                {/* <li onClick={() => handleMenuItemClick('/admin/reports')}>Báo cáo thống kê</li> */}
            </ul>
        </div>
    );
};

export default SidebarAdmin;
