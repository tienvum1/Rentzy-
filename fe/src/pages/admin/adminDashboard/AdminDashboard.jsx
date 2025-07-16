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
      <div className="for-admin-dashboard-layout">
        <SidebarAdmin />

        <div className="for-admin-dashboard-content">
          <div className="for-admin-dashboard-loading-container">

            <div>Đang tải dữ liệu...</div>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="for-admin-dashboard-layout">
        <SidebarAdmin />

        <div className="for-admin-dashboard-content">
          <div className="for-admin-dashboard-error-container">
            <div>
              <h3>Lỗi tải dữ liệu</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>


      </div>
    );
  }

  return (
    <div className="for-admin-dashboard-layout">
      <SidebarAdmin />

      <div className="for-admin-dashboard-content">
        <div className="for-admin-dashboard-header">
          <h1 className="for-admin-dashboard-title">Bảng điều khiển Admin</h1>
          <p className="for-admin-dashboard-subtitle">

            Chào mừng trở lại, {user.name}! Đây là tổng quan về hệ thống Rentzy.
          </p>
        </header>

        <div className="for-admin-dashboard-stats-grid">
          <div className="for-admin-dashboard-stat-card">
            <div className="for-admin-dashboard-stat-card-header">
              <span className="for-admin-dashboard-stat-card-title">
                Tổng người dùng
              </span>
              <div
                className="for-admin-dashboard-stat-card-icon"
                style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
              >
                👥
              </div>
            </div>
            <div className="for-admin-dashboard-stat-card-value">
              {formatNumber(dashboardData?.userStats?.total || 0)}
            </div>
            <div className="for-admin-dashboard-stat-card-change positive">
              <span>↗</span>
              <span>Hoạt động</span>
            </div>
          </div>

          <div className="for-admin-dashboard-stat-card">
            <div className="for-admin-dashboard-stat-card-header">
              <span className="for-admin-dashboard-stat-card-title">
                Tổng xe
              </span>
              <div
                className="for-admin-dashboard-stat-card-icon"
                style={{ backgroundColor: "#d1fae5", color: "#065f46" }}
              >
                🚗
              </div>
            </div>
            <div className="for-admin-dashboard-stat-card-value">
              {formatNumber(dashboardData?.vehicleStats?.total || 0)}
            </div>
            <div className="for-admin-dashboard-stat-card-change positive">
              <span>↗</span>
              <span>
                {formatNumber(dashboardData?.vehicleStats?.available || 0)} khả
                dụng
              </span>
            </div>
          </div>

          <div className="for-admin-dashboard-stat-card">
            <div className="for-admin-dashboard-stat-card-header">
              <span className="for-admin-dashboard-stat-card-title">
                Tổng đơn thuê
              </span>
              <div
                className="for-admin-dashboard-stat-card-icon"
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
              >
                📅
              </div>
            </div>
            <div className="for-admin-dashboard-stat-card-value">
              {formatNumber(dashboardData?.bookingStats?.total || 0)}
            </div>
            <div className="for-admin-dashboard-stat-card-change positive">
              <span>↗</span>
              <span>
                {formatNumber(dashboardData?.bookingStats?.completed || 0)} hoàn
                thành
              </span>
            </div>
          </div>

          <div className="for-admin-dashboard-stat-card">
            <div className="for-admin-dashboard-stat-card-header">
              <span className="for-admin-dashboard-stat-card-title">
                Doanh thu
              </span>
              <div
                className="for-admin-dashboard-stat-card-icon"
                style={{ backgroundColor: "#fce7f3", color: "#be185d" }}
              >
                💰
              </div>
            </div>
            <div className="for-admin-dashboard-stat-card-value">
              {formatCurrency(
                dashboardData?.transactionStats?.totalRevenue || 0
              )}
            </div>
            <div className="for-admin-dashboard-stat-card-change positive">
              <span>↗</span>
              <span>Tổng cộng</span>
            </div>
          </div>
        </div>

        <div className="for-admin-dashboard-charts-section">
          <div className="for-admin-dashboard-chart-card">
            <div className="for-admin-dashboard-chart-card-header">
              <h3 className="for-admin-dashboard-chart-card-title">
                Thống kê đơn thuê theo tháng
              </h3>
            </div>
            <div
              className="for-admin-dashboard-chart-container"
              style={{ width: "100%", height: 300 }}
            >
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                      hide
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Doanh thu"
                          ? `${value.toLocaleString()}₫`
                          : value
                      }
                    />
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
        </section>


          <div className="for-admin-dashboard-chart-card">
            <div className="for-admin-dashboard-chart-card-header">
              <h3 className="for-admin-dashboard-chart-card-title">
                Yêu cầu chờ duyệt
              </h3>
            </div>
            <div style={{ padding: "1rem 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <span>Yêu cầu chủ xe</span>
                <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                  {dashboardData?.pendingRequests?.ownerRequests || 0}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <span>Xác thực GPLX</span>
                <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                  {dashboardData?.pendingRequests?.driverLicenses || 0}
                </span>

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

          </div>
        </div>

        <div className="for-admin-dashboard-tables-section">
          <div className="for-admin-dashboard-table-card">
            <div className="for-admin-dashboard-table-card-header">
              <h3 className="for-admin-dashboard-table-card-title">
                Top 5 xe được thuê nhiều nhất
              </h3>
            </div>
            <table className="for-admin-dashboard-table">
              <thead>
                <tr>
                  <th>Xe</th>
                  <th>Chủ xe</th>
                  <th>Số lần thuê</th>
                  <th>Giá/ngày</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.topVehicles?.map((vehicle, index) => (
                  <tr key={vehicle._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "600" }}>
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {vehicle.licensePlate}
                        </div>
                      </div>
                    </td>
                    <td>{vehicle.owner?.name}</td>
                    <td>
                      <span className="for-admin-dashboard-status-badge completed">
                        {vehicle.rentalCount}
                      </span>
                    </td>
                    <td>{formatCurrency(vehicle.pricePerDay)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", color: "#64748b" }}
                    >
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="for-admin-dashboard-table-card">
            <div className="for-admin-dashboard-table-card-header">
              <h3 className="for-admin-dashboard-table-card-title">
                Top 5 chủ xe có doanh thu cao nhất
              </h3>
            </div>
            <table className="for-admin-dashboard-table">
              <thead>
                <tr>
                  <th>Chủ xe</th>
                  <th>Email</th>
                  <th>Doanh thu</th>
                  <th>Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.topOwners?.map((owner, index) => (
                  <tr key={owner._id}>
                    <td style={{ fontWeight: "600" }}>{owner.owner?.name}</td>
                    <td>{owner.owner?.email}</td>
                    <td style={{ fontWeight: "600", color: "#059669" }}>
                      {formatCurrency(owner.totalRevenue)}
                    </td>
                    <td>
                      <span className="for-admin-dashboard-status-badge approved">
                        {owner.bookingCount}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", color: "#64748b" }}
                    >
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="for-admin-dashboard-quick-actions">
          <h3 className="for-admin-dashboard-quick-actions-title">
            Thao tác nhanh
          </h3>
          <div className="for-admin-dashboard-quick-actions-grid">
            <a
              href="/admin/owner-requests"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">👤</span>
              <span>Duyệt yêu cầu chủ xe</span>
            </a>
            <a
              href="/admin/vehicle-approvals"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">🚗</span>
              <span>Duyệt xe mới</span>
            </a>
            <a
              href="/admin/driver-license-requests"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">📋</span>
              <span>Xác thực GPLX</span>
            </a>
            <a
              href="/admin/payout-requests"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">💰</span>
              <span>Duyệt giải ngân</span>
            </a>
            <a
              href="/admin/withdrawals"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">💸</span>
              <span>Quản lý rút tiền</span>
            </a>
            <a
              href="/admin/users"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">👥</span>
              <span>Quản lý người dùng</span>
            </a>
            <a
              href="/admin/vehicle-approvals"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">🚙</span>
              <span>Quản lý xe</span>
            </a>
            <a
              href="/admin/notifications"
              className="for-admin-dashboard-quick-action-btn"
            >
              <span className="for-admin-dashboard-quick-action-icon">🔔</span>
              <span>Thông báo</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
