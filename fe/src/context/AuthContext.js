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
      console.log("User profile fetched and updated in context:", response.data.user);
    } catch (error) {
      console.error("Error fetching user profile or not authenticated:", error);
      // Nếu lỗi (ví dụ: 401 Unauthorized), đặt user về null
      setUser(null);
      // Note: No need to manually clear cookie here as it's httpOnly and backend logout handles it
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
    console.log("Login triggered, fetching profile from backend...");
    // Backend sets the cookie, fetchUserProfile will get the updated user state
    fetchUserProfile();
  };

  // Hàm đăng xuất: Xóa state user và gọi API logout backend
  const logout = async () => {
    setUser(null); // Xóa thông tin user khỏi state frontend
    console.log("Logging out, clearing user state...");
    try {
      // Gọi API logout backend để xóa cookie
      await axios.get(`${backendUrl}/api/auth/logout`, {
        withCredentials: true, // Gửi cookie để backend xóa
      });
      console.log("Backend logout successful.");
    } catch (error) {
      console.error("Error during backend logout:", error);
      // Even if backend logout fails, user state is cleared on frontend
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
