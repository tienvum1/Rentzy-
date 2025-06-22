import React from 'react';
// Add icons import back
import { FaUser, FaHeart, FaCar, FaSuitcaseRolling, FaClipboardCheck, FaGift, FaWallet, FaLock, FaTrash } from 'react-icons/fa';
import './ProfileSidebar.css';
import { useNavigate, useLocation } from 'react-router-dom';
// Remove import menu items from the new file
// import { profileMenuItems } from '../../utils/profileMenuItems'; // Removed

const ProfileSidebar = ({ activeSection, onSectionChange }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Định nghĩa sectionId cho từng mục
    const menuItems = [
        { sectionId: 'account', label: 'Tài khoản của tôi', icon: <FaUser /> },
        { sectionId: 'favorites', label: 'Xe yêu thích', icon: <FaHeart /> },
        { sectionId: 'my-cars', label: 'Xe của tôi', icon: <FaCar /> },
        { sectionId: 'my-bookings', label: 'Đơn thuê của tôi', icon: <FaSuitcaseRolling /> },
        { sectionId: 'owner-management', label: 'Quản lí xe cho owner', icon: <FaClipboardCheck /> },
        { sectionId: 'transactions', label: 'Lịch sử giao dịch', icon: <FaGift /> },
        { sectionId: 'wallet', label: 'Ví của tôi', icon: <FaWallet /> },
        { sectionId: 'change-password', label: 'Đổi mật khẩu', icon: <FaLock /> },
        { sectionId: 'delete-account', label: 'Yêu cầu xoá tài khoản', icon: <FaTrash /> },
    ];

    return (
        <div className="profile-sidebar">
            <h2>Xin chào bạn!</h2>
            <ul className="sidebar-menu">
                {menuItems.map(item => (
                    <li
                        key={item.sectionId}
                        className={`sidebar-menu-item${activeSection === item.sectionId ? ' active' : ''}`}
                        onClick={() => onSectionChange ? onSectionChange(item.sectionId) : null}
                    >
                        <span>{item.icon}</span> {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProfileSidebar;