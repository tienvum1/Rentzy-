// fe/src/components/Header/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import the custom hook

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth(); // Sử dụng hook để lấy state và hàm từ context
  const [showDropdown, setShowDropdown] = useState(false);
  const avatarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Hiển thị loading hoặc header trống tạm thời nếu đang kiểm tra trạng thái đăng nhập ban đầu
  if (isLoading) {
      return <header className="header-modern"><div>Loading...</div></header>;
  }

  const handleLogout = () => {
    setShowDropdown(false);
    logout(); // Gọi hàm logout từ context
    navigate('/login'); // Redirect đến trang login sau khi logout
  };

  const handleAccountSettings = () => {
    setShowDropdown(false);
    navigate('/account-settings'); // Đường dẫn đến trang cài đặt tài khoản
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  return (
    <header className="header-modern">
      <div className="header__logo-row-modern" onClick={() => navigate('/')} style={{cursor: 'pointer'}}
>
        <img src="https://cdn-icons-png.flaticon.com/512/854/854894.png" alt="Car Logo" className="header__logo-modern" />
        <span className="header__brand-name-modern">Rentzy</span>
      </div>
      <nav className="header__nav">
        <Link to="/" className="header__link">Home</Link>
        <Link to="/vehicles" className="header__link">Vehicles</Link>
        <Link to="/features" className="header__link">Features</Link>
        <Link to="/contact" className="header__link">Contact</Link>
      </nav>
      <div className="header__actions">
        {isAuthenticated ? (
          <div className="header__user-actions">
            <div
              className="header__user-avatar"
              ref={avatarRef}
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={user.avatar_url || 'https://via.placeholder.com/40/cccccc/ffffff?text=User'}
                alt={user.name || 'User Avatar'}
                className="avatar-img"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span className="user-name">{user.name}</span>
            </div>
            {showDropdown && (
              <div className="header__dropdown" ref={dropdownRef}>
                <button className="header__dropdown-item" onClick={handleViewProfile}>
                  Xem hồ sơ
                </button>
              
                <button className="header__dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              className="header__login"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button className="header__signup" onClick={() => navigate('/register')}>
              Sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;