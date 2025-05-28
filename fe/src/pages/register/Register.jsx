import React, { useState } from 'react';
import './Register.css';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import { useNavigate } from 'react-router-dom';


const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      setIsError(true);
      return;
    }

    try {
    

      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`;

      const response = await axios.post(apiUrl, {
        name,
        email,
        password,
      });

      setMessage(response.data.message);
      setIsError(false);

      navigate('/login');

    } catch (error) {
      console.error('Error during registration:', error);
      if (error.response) {
        setMessage(`Đăng ký thất bại: ${error.response.data.message || error.response.statusText}`);
        setIsError(true);
      } else {
        setMessage('Đã xảy ra lỗi trong quá trình đăng ký.');
        setIsError(true);
      }
    }
  };

  return (
    <>
    <Header/>
    <div className="register-container">
      <h2>Đăng ký</h2>
      {message && (
        <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Tên:</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
        <button type="submit">Đăng ký</button>
      </form>
    </div>
    <Footer/>
    </>
  );
};

export default Register; 