import React, { useState, useEffect } from 'react'; // Keep useEffect if needed for other logic
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // No longer need useSearchParams
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import './SetPassword.css';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Removed clientToken state

  const navigate = useNavigate();
  // Removed useSearchParams hook

  // Removed useEffect for reading token from URL

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      setIsError(true);
      return;
    }

    if (password.length < 6) {
       setMessage('Mật khẩu phải có ít nhất 6 ký tự.');
       setIsError(true);
       return;
    }

    // No longer need to check clientToken state before submitting,
    // as authentication is now expected via cookie.

    setIsLoading(true);
    setMessage(''); // Clear previous messages

    try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const apiUrl = `${backendUrl}/api/auth/set-password`;
        const response = await axios.put(apiUrl, { password }, {
             withCredentials: true // Frontend gửi cookie
             // Removed Authorization header logic
        });

        setMessage(response.data.message || 'Mật khẩu đã được thiết lập thành công.');
        setIsError(false);
        setPassword('');
        setConfirmPassword('');

        // Backend đã set cookie mới sau khi set password.
        // Redirect về homepage. AuthProvider sẽ tự động fetch lại profile.
        setTimeout(() => {
           navigate('/homepage'); // Redirect to homepage
        }, 3000);


    } catch (error) {
      console.error('Lỗi thiết lập mật khẩu:', error);
      setIsError(true);
      if (error.response) {
        setMessage(`Thiết lập mật khẩu thất bại: ${error.response.data.message || error.response.statusText}`);
      } else {
        setMessage('Đã xảy ra lỗi khi thiết lập mật khẩu.');
      }
       // Still handle 401 errors - might happen if cookie expired or wasn't set
       if (error.response && error.response.status === 401) {
           setMessage('Phiên làm việc hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
           setTimeout(() => {
               navigate('/login'); // Redirect to login
           }, 3000);
       }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="set-password-container">
        <h2>Thiết lập mật khẩu</h2>
         {/* Removed condition checking clientToken for form visibility */}
        {message && (
          <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>
        )}
        {isLoading && <p>Đang xử lý...</p>}

        {/* Form is always visible, rely on backend 401 for auth check */}
        <form onSubmit={handleSubmit}>
         <div className="form-group">
           <label htmlFor="password">Mật khẩu mới:</label>
           <input
             type="password"
             id="password"
             name="password"
             required
             value={password}
             onChange={(e) => setPassword(e.target.value)}
           />
         </div>
         <div className="form-group">
           <label htmlFor="confirm-password">Xác nhận mật khẩu:</label>
           <input
             type="password"
             id="confirm-password"
             name="confirm-password"
             required
             value={confirmPassword}
             onChange={(e) => setConfirmPassword(e.target.value)}
           />
         </div>
         <button type="submit" disabled={isLoading}>
           {isLoading ? 'Đang lưu...' : 'Thiết lập mật khẩu'}
         </button>
       </form>
      </div>
      <Footer />
    </>
  );
};

export default SetPassword;