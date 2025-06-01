import React from 'react';
import { FaUser, FaHeart, FaCar, FaSuitcaseRolling, FaClipboardCheck, FaGift, FaAddressBook, FaLock, FaTrash } from 'react-icons/fa';
import './ProfileSidebar.css';

const ProfileSidebar = ({ activeSection, onSectionChange }) => {
    const menuItems = [
        { id: 'account', label: 'Tài khoản của tôi', icon: <FaUser /> },
        { id: 'favorites', label: 'Xe yêu thích', icon: <FaHeart /> },
        { id: 'my-cars', label: 'Xe của tôi', icon: <FaCar /> },
        { id: 'trips', label: 'Chuyến của tôi', icon: <FaSuitcaseRolling /> },
        { id: 'long-term-rentals', label: 'Đơn hàng Thuê xe dài hạn', icon: <FaClipboardCheck /> },
        { id: 'gifts', label: 'Quà tặng', icon: <FaGift /> },
        { id: 'addresses', label: 'Địa chỉ của tôi', icon: <FaAddressBook /> },
        { id: 'change-password', label: 'Đổi mật khẩu', icon: <FaLock /> },
        { id: 'delete-account', label: 'Yêu cầu xoá tài khoản', icon: <FaTrash /> },
    ];

    return (
        <div className="profile-sidebar">
            <h2>Xin chào bạn!</h2>
            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        className={`sidebar-menu-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => onSectionChange(item.id)}
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