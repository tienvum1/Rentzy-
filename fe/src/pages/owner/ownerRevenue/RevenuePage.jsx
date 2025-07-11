import React, { useEffect, useState } from 'react';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import './RevenuePage.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

const typeOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

const RevenuePage = () => {
  const [type, setType] = useState('month');
  const [revenueData, setRevenueData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/api/owner/revenue?type=${type}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (data.success) {
          setRevenueData(data.revenue);
          setTotal(data.total?.totalRevenue || 0);
        } else {
          setError(data.message || 'Lỗi khi lấy dữ liệu doanh thu');
        }
      } catch (err) {
        setError('Lỗi kết nối server');
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [type]);

  // Chuẩn hóa dữ liệu cho recharts
  const chartData = revenueData.map(item => {
    let label = '';
    if (type === 'day') label = `${item._id.day}/${item._id.month}/${item._id.year}`;
    else if (type === 'week') label = `Tuần ${item._id.week}/${item._id.year}`;
    else if (type === 'month') label = `${item._id.month}/${item._id.year}`;
    else if (type === 'year') label = `${item._id.year}`;
    return {
      label,
      revenue: item.totalRevenue,
    };
  });

  return (
    <div className="revenue-container">
      <SidebarOwner />
      <div className="revenue-content">
        <h1>Doanh thu của bạn</h1>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="type-select">Xem theo: </label>
          <select id="type-select" value={type} onChange={e => setType(e.target.value)}>
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div className="total-revenue-box">
              <strong>Tổng doanh thu: </strong>
              <span>{total.toLocaleString()} VND</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#007bff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenuePage; 