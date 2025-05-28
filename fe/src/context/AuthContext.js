// fe/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Lưu thông tin user hoặc null nếu chưa đăng nhập
  const [isLoading, setIsLoading] = useState(true); // Trạng thái loading khi kiểm tra đăng nhập ban đầu
  const backendUrl = process.env.REACT_APP_BACKEND_URL; // Lấy URL backend từ biến môi trường

  // Hàm để lấy thông tin user profile từ backend
  const fetchUserProfile = async () => {
    setIsLoading(true); // Bắt đầu loading
    try {
      // Gửi request đến API profile, đảm bảo gửi kèm cookie
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });
      // Nếu thành công, lưu thông tin user vào state
      setUser(response.data.user);
      console.log("User profile fetched and set:", response.data.user);
    } catch (error) {
      console.error("Error fetching user profile or not authenticated:", error);
      // Nếu lỗi (ví dụ: 401 Unauthorized), đặt user về null
      setUser(null);
      // Tùy chọn: Xóa cookie token nếu request trả về 401 để đảm bảo trạng thái sạch
      if (error.response && error.response.status === 401) {
        console.log("Authentication failed, clearing user state.");
        // Code để xóa cookie ở frontend (cần cẩn thận với httpOnly)
        // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  // Effect chạy khi component mount để kiểm tra trạng thái đăng nhập ban đầu
  useEffect(() => {
    fetchUserProfile(); // Gọi hàm fetchUserProfile để kiểm tra token từ cookie
  }, []); // Dependency rỗng, chỉ chạy 1 lần khi component mount

  // Hàm đăng nhập: Cập nhật state user sau khi đăng nhập thành công
  const login = (userData) => {
    setUser(userData); // Lưu thông tin user sau khi login thành công (thường nhận từ response backend)
    console.log("User logged in:", userData);
    // Sau khi backend set cookie, fetchUserProfile sẽ xác nhận lại
    fetchUserProfile();
  };

  // Hàm đăng xuất: Xóa state user và gọi API logout backend
  const logout = async () => {
    setUser(null); // Xóa thông tin user khỏi state frontend
    console.log("User logged out on frontend.");
    try {
      // Gọi API logout backend để xóa cookie
      await axios.get(`${backendUrl}/api/auth/logout`, {
        withCredentials: true, // Gửi cookie để backend xóa
      });
      console.log("Backend logout successful (cookie cleared).");
    } catch (error) {
      console.error("Error during backend logout:", error);
    }
  };

  // Giá trị sẽ được cung cấp bởi Context cho các component con
  const contextValue = {
    user,
    isAuthenticated: !!user, // Trạng thái đăng nhập (true nếu user khác null)
    isLoading, // Trạng thái loading ban đầu
    login, // Hàm đăng nhập
    logout, // Hàm đăng xuất
    fetchUserProfile, // Hàm refresh profile (ví dụ sau set password)
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
