// fe/src/components/Header/Header.jsx
import React from 'react';
import './Header.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import the custom hook

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth(); // Sử dụng hook để lấy state và hàm từ context

  // Hiển thị loading hoặc header trống tạm thời nếu đang kiểm tra trạng thái đăng nhập ban đầu
  if (isLoading) {
      return <header className="header"><div>Loading...</div></header>;
  }

  const handleLogout = () => {
    logout(); // Gọi hàm logout từ context
    navigate('/login'); // Redirect đến trang login sau khi logout
  };

  return (
    <header className="header">
      <div className="header__logo">Rentalia</div>
      <nav className="header__nav">
        {/* Các link điều hướng */}
        <Link to="/" className="header__link">Home</Link>
        <Link to="/vehicles" className="header__link">Vehicles</Link>
        <Link to="/features" className="header__link">Features</Link>
        <Link to="/contact" className="header__link">Contact</Link>
      </nav>
      <div className="header__actions">
        {isAuthenticated ? (
          // Hiển thị avatar và nút logout nếu đã đăng nhập
          <div className="header__user-actions"> {/* Container cho avatar và menu */}
            <div className="header__user-avatar" /* Có thể thêm onClick để mở menu user */>
              <img
                src={user.avatar_url || 'https://via.placeholder.com/40/cccccc/ffffff?text=User'} // Sử dụng avatar_url hoặc ảnh mặc định
              
                className="avatar-img" // Thêm class CSS để style ảnh
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} // Ví dụ style inline
              />
              <span className="user-name">{user.name}</span>
            </div>
             <button className="header__logout" onClick={handleLogout}>
                Logout
             </button>
          </div>
        ) : (
          // Hiển thị nút Login/Sign up nếu chưa đăng nhập
          <>
            <button
              className="header__login"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button className="header__signup"
            onClick = {() => navigate('/register')}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;