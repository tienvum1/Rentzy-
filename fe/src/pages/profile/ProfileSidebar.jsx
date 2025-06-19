import React from 'react';
// Add icons import back
import { FaUser, FaHeart, FaCar, FaSuitcaseRolling, FaClipboardCheck, FaGift, FaWallet, FaLock, FaTrash } from 'react-icons/fa';
import './ProfileSidebar.css';
import { useNavigate, useLocation } from 'react-router-dom';
// Remove import menu items from the new file
// import { profileMenuItems } from '../../utils/profileMenuItems'; // Removed

const ProfileSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Define the menu items array directly here with full paths
    const menuItems = [
        { path: '/profile', label: 'Tài khoản của tôi', icon: <FaUser /> }, // Path for main profile page
        { path: '/profile/favorites', label: 'Xe yêu thích', icon: <FaHeart /> },
        { path: '/profile/my-cars', label: 'Xe của tôi', icon: <FaCar /> },
        { path: '/profile/my-bookings', label: 'Đơn thuê của tôi', icon: <FaSuitcaseRolling /> },
        { path: '/ownerpage/overview', label: 'Quản lí xe cho owner', icon: <FaClipboardCheck /> }, // Full path for owner dashboard overview
    
        { path: '/profile/transactions', label: 'Lịch sử giao dịch', icon: <FaGift /> },
        { path: '/profile/wallet', label: 'Ví của tôi', icon: <FaWallet /> },
        { path: '/profile/change-password', label: 'Đổi mật khẩu', icon: <FaLock /> }, // Full path for change password
        { path: '/profile/delete-account', label: 'Yêu cầu xoá tài khoản', icon: <FaTrash /> },
        // Add other profile sub-pages here as needed with their full paths
    ];

    return (
        <div className="profile-sidebar">
            <h2>Xin chào bạn!</h2>
            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <div
                        key={item.path} // Use path as key
                        // Active class check: check if current path starts with item.path
                        className={`sidebar-menu-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)} // Navigate directly to item.path
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <span className="menu-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileSidebar;