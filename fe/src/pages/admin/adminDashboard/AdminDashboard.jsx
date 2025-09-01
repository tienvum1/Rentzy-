import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import SidebarAdmin from "../../../components/SidebarAdmin/SidebarAdmin";
import "./AdminDashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || !user || !user.role.includes("admin"))
    ) {
      navigate("/");
    }
  }, [user, isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role.includes("admin")) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const monthlyChartData = (dashboardData?.monthlyStats || []).map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    "Số đơn": item.count,
    "Doanh thu": item.revenue,
  }));

  if (isLoading || !isAuthenticated || !user || !user.role.includes("admin")) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-dashboard-layout">
        <SidebarAdmin />
        <main className="admin-dashboard-content">
          <section className="loading-section">
            <div className="loading-spinner" />
            <div>Đang tải dữ liệu...</div>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-layout">
        <SidebarAdmin />
        <main className="admin-dashboard-content">
          <section className="error-section">
            <h3>Lỗi tải dữ liệu</h3>
            <p>{error}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <SidebarAdmin />
      <main className="admin-dashboard-content">
        {/* Header */}
        <header className="admin-dashboard-header center-header">
          <h1 className="admin-dashboard-title">Bảng điều khiển Admin</h1>
          <p className="admin-dashboard-subtitle">
            Chào mừng trở lại, {user.name}! Đây là tổng quan về hệ thống Rentzy.
          </p>
        </header>

        {/* Stats Row */}
        <section className="stats-section stats-row">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Tổng người dùng</span>
                <div className="stat-card-icon" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>👥</div>
              </div>
              <div className="stat-card-value">{formatNumber(dashboardData?.userStats?.total || 0)}</div>
              <div className="stat-card-change positive">
                <span>↗</span>
                <span>Hoạt động</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Tổng xe</span>
                <div className="stat-card-icon" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>🚗</div>
              </div>
              <div className="stat-card-value">{formatNumber(dashboardData?.vehicleStats?.total || 0)}</div>
              <div className="stat-card-change positive">
                <span>↗</span>
                <span>{formatNumber(dashboardData?.vehicleStats?.available || 0)} khả dụng</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Tổng đơn thuê</span>
                <div className="stat-card-icon" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>📅</div>
              </div>
              <div className="stat-card-value">{formatNumber(dashboardData?.bookingStats?.total || 0)}</div>
              <div className="stat-card-change positive">
                <span>↗</span>
                <span>{formatNumber(dashboardData?.bookingStats?.completed || 0)} hoàn thành</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Doanh thu</span>
                <div className="stat-card-icon" style={{ backgroundColor: "#fce7f3", color: "#be185d" }}>💰</div>
              </div>
              <div className="stat-card-value">{formatCurrency(dashboardData?.transactionStats?.totalRevenue || 0)}</div>
              <div className="stat-card-change positive">
                <span>↗</span>
                <span>Tổng cộng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Section: 2 columns */}
        <section className="main-section-2col">
          <div className="main-left-col">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Thống kê đơn thuê theo tháng</h3>
              </div>
              <div className="chart-container">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" hide />
                      <Tooltip formatter={(value, name) => name === "Doanh thu" ? `${value.toLocaleString()}₫` : value} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Số đơn" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="Doanh thu" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div>Chưa có dữ liệu thống kê</div>
                )}
              </div>
            </div>
            {/* Hai bảng nằm ngang */}
            <div className="top-tables-row">
              <div className="table-card">
                <div className="table-card-header">
                  <h3 className="table-card-title">Top 5 xe được thuê nhiều nhất</h3>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Xe</th>
                      <th>Chủ xe</th>
                      <th>Số lần thuê</th>
                      <th>Giá/ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.topVehicles?.length > 0 ? (
                      dashboardData.topVehicles.map((vehicle) => (
                        <tr key={vehicle._id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: "600" }}>{vehicle.brand} {vehicle.model}</div>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{vehicle.licensePlate}</div>
                            </div>
                          </td>
                          <td>{vehicle.owner?.name}</td>
                          <td><span className="status-badge completed">{vehicle.rentalCount}</span></td>
                          <td>{formatCurrency(vehicle.pricePerDay)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-card">
                <div className="table-card-header">
                  <h3 className="table-card-title">Top 5 chủ xe có doanh thu cao nhất</h3>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Chủ xe</th>
                      <th>Email</th>
                      <th>Doanh thu</th>
                      <th>Số đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.topOwners?.length > 0 ? (
                      dashboardData.topOwners.map((owner) => (
                        <tr key={owner._id}>
                          <td style={{ fontWeight: "600" }}>{owner.owner?.name}</td>
                          <td>{owner.owner?.email}</td>
                          <td style={{ fontWeight: "600", color: "#059669" }}>{formatCurrency(owner.totalRevenue)}</td>
                          <td><span className="status-badge approved">{owner.bookingCount}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* End hai bảng nằm ngang */}
          </div>
          <div className="main-right-col">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Yêu cầu chờ duyệt</h3>
              </div>
              <div className="pending-requests-list">
                <div className="pending-request-item">
                  <span>Yêu cầu chủ xe</span>
                  <span className="pending-request-count">{dashboardData?.pendingRequests?.ownerRequests || 0}</span>
                </div>
                <div className="pending-request-item">
                  <span>Xác thực GPLX</span>
                  <span className="pending-request-count">{dashboardData?.pendingRequests?.driverLicenses || 0}</span>
                </div>
                <div className="pending-request-item">
                  <span>Duyệt xe</span>
                  <span className="pending-request-count">{dashboardData?.pendingRequests?.payouts || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
