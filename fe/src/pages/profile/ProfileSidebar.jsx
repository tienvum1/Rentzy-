import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaHeart, FaCar, FaSuitcaseRolling, FaClipboardCheck, FaGift, FaWallet, FaLock, FaTrash } from 'react-icons/fa';
import './ProfileSidebar.css';

const menuItems = [
  { id: 'account', icon: <FaUser />, label: 'Tài khoản của tôi', path: '/profile/account' },
  { id: 'favorites', icon: <FaHeart />, label: 'Xe yêu thích', path: '/profile/favorites' },
  { id: 'my-cars', icon: <FaCar />, label: 'Xe của tôi', path: '/profile/my-cars' },
  { id: 'my-bookings', icon: <FaSuitcaseRolling />, label: 'Đơn thuê của tôi', path: '/profile/my-bookings' },
  { id: 'owner-management', icon: <FaClipboardCheck />, label: 'Quản lí xe cho owner', path: '/profile/owner-management' },
  { id: 'transactions', icon: <FaGift />, label: 'Lịch sử giao dịch', path: '/profile/transactions' },
  { id: 'wallet', icon: <FaWallet />, label: 'Ví của tôi', path: '/profile/wallet' },
  { id: 'change-password', icon: <FaLock />, label: 'Đổi mật khẩu', path: '/profile/change-password' },
  { id: 'delete-account', icon: <FaTrash />, label: 'Yêu cầu xoá tài khoản', path: '/profile/delete-account' },
];

const ProfileSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định active dựa trên pathname
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar-profile">
      <div className="sidebar-header">
        <h3>Quản lý tài khoản</h3>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={isActive(item.path) ? 'active' : ''}
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">{item.icon}</span> {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileSidebar;