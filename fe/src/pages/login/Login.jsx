import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'; // Assuming you have CSS for styling
import Header from '../../components/header/Header'; // Assuming Header component exists
import Footer from '../../components/footer/Footer'; // Assuming Footer component exists
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { login } = useAuth(); 

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const apiUrl = `${backendUrl}/api/auth/login`;
      const response = await axios.post(apiUrl, { email, password }, { withCredentials: true });

      // Assuming backend returns user data in response.data.user
      // Call login function from context
      login(response.data.user); // <--- Gọi hàm login từ context

      setMessage(response.data.message || 'Đăng nhập thành công!');
      setIsError(false);

      // Redirect to homepage after successful login
      setTimeout(() => {
          navigate('/homepage');
      }, 1000); // Redirect faster after login

  }   catch (error) {
      console.error('Đăng nhập thất bại:', error.response?.data || error.message);
      setIsError(true);
      let errorMessage = 'Đã xảy ra lỗi trong quá trình đăng nhập.'; // Default error message

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          const backendMessage = error.response.data.data.message;

          if (backendMessage === 'Email not found') {
            errorMessage = 'Email không tồn tại.';
          } else if (backendMessage === 'Incorrect password') {
            errorMessage = 'Mật khẩu không đúng.';
          } else if (backendMessage === 'Please verify your email') {
            errorMessage = 'Tài khoản chưa xác thực. Vui lòng kiểm tra email để xác thực.';
          } else {
            errorMessage = `Đăng nhập thất bại: ${backendMessage}`;
          }
        } else {
          errorMessage = `Đăng nhập thất bại: ${error.response.statusText || 'Lỗi không xác định từ server.'}`;
        }
      }

      setMessage(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) {
       setMessage('Lỗi cấu hình: Không tìm thấy URL backend.');
       setIsError(true);
       return;
    }
    // Redirect to the backend Google auth route
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <>
    <Header />
    <div className="login-container">
      <h2>Đăng nhập</h2>
      {message && (
        <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mật khẩu:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Đăng nhập</button>
      </form>

      {/* Add Google Login Button */}
      <div className="or-divider">Hoặc</div>
      <button className="google-login-button" onClick={handleGoogleLogin}>
        Đăng nhập bằng Google
      </button>
      {/* You might need to add styling for .or-divider and .google-login-button in Login.css */}

    </div>
    <Footer />
    </>
  );
};

export default Login;