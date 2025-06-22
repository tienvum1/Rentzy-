import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SidebarAdmin.css'; // Import file CSS
// Bạn có thể cần thêm các icon ở đây nếu muốn
// import { MdDashboard, MdPersonAdd, MdDirectionsCar } from 'react-icons/md';

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
                {/* Mục điều hướng Dashboard tổng quan (nếu có) */}
                {/* <li onClick={() => handleMenuItemClick('/admin')}> */}
                {/*     <MdDashboard className="menu-icon" /> Dashboard */}
                {/* </li> */}

                {/* Mục điều hướng Duyệt chủ xe */}
                <li onClick={() => handleMenuItemClick('/admin/owner-requests')}> {/* Route ví dụ: /admin/owner-requests */}
                    {/* <MdPersonAdd className="menu-icon" /> */} Duyệt chủ xe
                </li>

                {/* Mục điều hướng Duyệt xe thuê */}
                <li onClick={() => handleMenuItemClick('/admin/vehicle-approvals')}> {/* Route ví dụ: /admin/vehicle-approvals */}
                    {/* <MdDirectionsCar className="menu-icon" /> */} Duyệt xe
                </li>

                {/* Mục điều hướng Duyệt GPLX */}
                <li onClick={() => handleMenuItemClick('/admin/driver-license-requests')}>
                    {/* <MdAssignmentInd className="menu-icon" /> */} Duyệt GPLX
                </li>

                {/* Thêm các mục admin khác nếu cần */}
                {/* <li>...</li> */}
            </ul>
        </div>
    );
};

export default SidebarAdmin;
