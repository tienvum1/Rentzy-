// fe/src/components/SidebarOwner/SidebarOwner.jsx
import React from 'react';
import './SidebarOwner.css'; // File CSS riêng cho sidebar (bạn có thể cần tạo nó)
import { NavLink } from 'react-router-dom';
import { MdOutlineDashboard, MdDirectionsCar, MdCalendarMonth, MdNotifications, MdShowChart, MdLogout } from 'react-icons/md';

// Component SidebarOwner nhận các prop:
// handleLogout: function - hàm được gọi khi click vào nút đăng xuất
const SidebarOwner = ({ handleLogout }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">Owner dashboard</div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink
                            to="/ownerpage/overview"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <MdOutlineDashboard />
                            Overview
                        </NavLink>
                    </li>
                    <li className="divider"></li>
                    <li>
                        <NavLink
                            to="/ownerpage/vehicle-management"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <MdDirectionsCar />
                            Vehicle management
                        </NavLink>
                    </li>
                    <li className="divider"></li>
                    <li>
                        <NavLink
                            to="/ownerpage/booking-management"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <MdCalendarMonth />
                            Booking management
                        </NavLink>
                    </li>
                    <li className="divider"></li>
                    <li>
                        <NavLink
                            to="/ownerpage/notification"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <MdNotifications />
                            Notification
                        </NavLink>
                    </li>
                    <li className="divider"></li>
                    <li>
                        <NavLink
                            to="/ownerpage/revenue"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <MdShowChart />
                            Revenue
                        </NavLink>
                    </li>
                    <li className="divider"></li>
                    <li>
                        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handleLogout(e); }}>
                            <MdLogout />
                            Logout
                        </a>
                    </li>
                    <li className="divider"></li>
                </ul>
            </nav>
        </div>
    );
};

export default SidebarOwner;