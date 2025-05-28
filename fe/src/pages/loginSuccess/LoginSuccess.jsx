import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// Assuming backend sets a cookie named 'token' or returns it in the URL/localStorage

const LoginSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayMessage, setDisplayMessage] = useState('Đang xử lý đăng nhập Google...'); // State for message

  useEffect(() => {
    // Check for the needsSetPassword query parameter
    const needsSetPassword = searchParams.get('needsSetPassword') === 'true';

    if (needsSetPassword) {
      // User needs to set a password. Redirect to set password page.
      setDisplayMessage('Đăng nhập thành công! Bạn cần thiết lập mật khẩu. Đang chuyển hướng...');
      const redirectTimer = setTimeout(() => {
        navigate('/set-password');
      }, 2000); // Redirect after 2 seconds

      return () => clearTimeout(redirectTimer); // Cleanup the timer

    } else {
      // User does not need to set password. Redirect to homepage.
      setDisplayMessage('Đăng nhập Google thành công! Đang chuyển hướng đến trang chủ...');
       const redirectTimer = setTimeout(() => {
        navigate('/');
      }, 2000); // Redirect after 2 seconds

      return () => clearTimeout(redirectTimer); // Cleanup the timer
    }

    // No dependencies needed here as the logic depends only on searchParams and navigate,
    // which are already in the dependency array.

  }, [searchParams, navigate]); // Dependency array

  // This component will only display a message while the redirect is happening
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>{displayMessage}</h2>
      {/* Optional: add a loading spinner */}
    </div>
  );
};

export default LoginSuccess; 