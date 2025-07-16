import React, { useEffect, useState } from 'react';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import './RevenuePage.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DatePicker, Space } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';

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
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Helper để lấy start/end theo type
  const getRange = () => {
    if (type === 'day') {
      const start = selectedDate.startOf('day').toISOString();
      const end = selectedDate.endOf('day').toISOString();
      return { start, end };
    } else if (type === 'month') {
      const start = selectedDate.startOf('month').toISOString();
      const end = selectedDate.endOf('month').toISOString();
      return { start, end };
    } else if (type === 'year') {
      const start = selectedDate.startOf('year').toISOString();
      const end = selectedDate.endOf('year').toISOString();
      return { start, end };
    }
    return {};
  };

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      setError('');
      try {
        let url = `${API_URL}/api/owner/revenue?type=${type}`;
        const { start, end } = getRange();
        if (start && end) url += `&start=${start}&end=${end}`;
        const res = await fetch(url, {
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
    // eslint-disable-next-line
  }, [type, selectedDate]);

  // Chuẩn hóa dữ liệu cho recharts
  const chartData = Array.isArray(revenueData) ? revenueData.map(item => {
    let label = '';
    if (type === 'day') label = `${item._id.day}/${item._id.month}/${item._id.year}`;
    else if (type === 'week') label = `Tuần ${item._id.week}/${item._id.year}`;
    else if (type === 'month') label = `${item._id.month}/${item._id.year}`;
    else if (type === 'year') label = `${item._id.year}`;
    return {
      label,
      revenue: item.totalRevenue,
    };
  }) : [];

  // Định dạng số tiền
  const formatCurrency = (value) => value?.toLocaleString('vi-VN') + ' VND';

  // Định dạng ngày tháng
  const renderDatePicker = () => {
    if (type === 'day') {
      return <DatePicker value={selectedDate} onChange={setSelectedDate} format="DD/MM/YYYY" allowClear={false} />;
    } else if (type === 'month') {
      return <DatePicker picker="month" value={selectedDate} onChange={setSelectedDate} format="MM/YYYY" allowClear={false} />;
    } else if (type === 'year') {
      return <DatePicker picker="year" value={selectedDate} onChange={setSelectedDate} format="YYYY" allowClear={false} />;
    }
    return null;
  };

  return (
    <div className="revenue-container">
      <SidebarOwner />
      <div className="revenue-content improved">
        <h1>Doanh thu của bạn</h1>
        <div className="revenue-filter-bar">
          <label htmlFor="type-select">Xem theo: </label>
          <select id="type-select" value={type} onChange={e => setType(e.target.value)}>
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Space style={{ marginLeft: 16 }}>{renderDatePicker()}</Space>
        </div>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div className="revenue-total-box">
              <strong>Tổng doanh thu: </strong>
              <span>{formatCurrency(total)}</span>
            </div>
            <ResponsiveContainer width="100%" height={370}>
              <LineChart data={chartData} margin={{ top: 20, right: 50, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={v => v?.toLocaleString('vi-VN')} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  label={({ x, y, value, index }) => {
                    if (!value) return null;
                    // Dịch chuyển label vào trong nếu là điểm đầu/cuối
                    let dx = 0;
                    if (index === 0) dx = 30;
                    if (index === chartData.length - 1) dx = -30;
                    return (
                      <text x={x + dx} y={y - 10} fill="#2563eb" fontWeight="bold" fontSize={13} textAnchor="middle">
                        {value.toLocaleString('vi-VN')}
                      </text>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenuePage;