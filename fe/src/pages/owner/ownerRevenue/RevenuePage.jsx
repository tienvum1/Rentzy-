import React, { useEffect, useState } from 'react';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import './RevenuePage.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
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
  const [chartType, setChartType] = useState('area'); // area, line, bar
  const [revenueData, setRevenueData] = useState([]);
  const [total, setTotal] = useState(0);
  const [grossTotal, setGrossTotal] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [platformFeeRate, setPlatformFeeRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Màu sắc cho biểu đồ
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    gradient: ['#3b82f6', '#1d4ed8']
  };

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
          setGrossTotal(data.total?.grossRevenue || 0);
          setPlatformFee(data.total?.platformFee || 0);
          setPlatformFeeRate(data.platformFeeRate || 0);
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
  const chartData = Array.isArray(revenueData) ? revenueData.map((item, index) => {
    let label = '';
    let shortLabel = '';
    if (type === 'day') {
      label = `${item._id.day}/${item._id.month}/${item._id.year}`;
      shortLabel = `${item._id.day}/${item._id.month}`;
    } else if (type === 'week') {
      label = `Tuần ${item._id.week}/${item._id.year}`;
      shortLabel = `T${item._id.week}`;
    } else if (type === 'month') {
      const monthNames = ['', 'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
      label = `${monthNames[item._id.month]}/${item._id.year}`;
      shortLabel = monthNames[item._id.month];
    } else if (type === 'year') {
      label = `${item._id.year}`;
      shortLabel = `${item._id.year}`;
    }
    return {
      label,
      shortLabel,
      revenue: item.totalRevenue,
      grossRevenue: item.grossRevenue || 0,
      platformFee: item.platformFee || 0,
      bookingCount: item.count || 0,
      index: index + 1
    };
  }) : [];

  // Dữ liệu cho biểu đồ tròn
  const pieData = [
    { name: 'Doanh thu thực nhận', value: total, color: colors.primary },
    { name: 'Phí platform', value: platformFee, color: colors.danger }
  ];

  // Định dạng số tiền
  const formatCurrency = (value) => value?.toLocaleString('vi-VN') + ' VND';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          <p className="tooltip-revenue">
            <span className="tooltip-dot" style={{ backgroundColor: colors.primary }}></span>
            {`Doanh thu: ${formatCurrency(data.revenue)}`}
          </p>
          {data.grossRevenue > 0 && (
            <p className="tooltip-gross">
              <span className="tooltip-dot" style={{ backgroundColor: colors.secondary }}></span>
              {`Tổng gốc: ${formatCurrency(data.grossRevenue)}`}
            </p>
          )}
          {data.bookingCount > 0 && (
            <p className="tooltip-bookings">
              {`Số booking: ${data.bookingCount}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render biểu đồ theo loại
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="shortLabel" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.primary}
              strokeWidth={3}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="shortLabel" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill={colors.primary}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="shortLabel" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.primary}
              strokeWidth={3}
              dot={{ fill: colors.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: colors.primary, strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        );
    }
  };

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
    <div className="revenue-layout">
      <SidebarOwner />
      <div className="revenue-container">
        <div className="revenue-content improved">
          <h1>Doanh thu của bạn</h1>
        <div className="revenue-filter-bar">
          <div className="filter-group">
            <label htmlFor="type-select">Loại thống kê:</label>
            <select 
              id="type-select"
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="revenue-select"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="chart-type-select">Loại biểu đồ:</label>
            <select 
              id="chart-type-select"
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              className="revenue-select"
            >
              <option value="area">Biểu đồ vùng</option>
              <option value="line">Biểu đồ đường</option>
              <option value="bar">Biểu đồ cột</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="date-picker">Chọn thời gian:</label>
            <div className="date-picker-wrapper">
              {renderDatePicker()}
            </div>
          </div>
        </div>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div className="revenue-summary">
              <div className="revenue-card main">
                <h3>Doanh thu thực nhận</h3>
                <div className="amount">{formatCurrency(total)}</div>
                <div className="subtitle">Sau khi trừ phí platform</div>
              </div>
              
              <div className="revenue-breakdown">
                <div className="revenue-card">
                  <h4>Tổng doanh thu gốc</h4>
                  <div className="amount-small">{formatCurrency(grossTotal)}</div>
                </div>
                <div className="revenue-card">
                  <h4>Phí platform ({(platformFeeRate * 100).toFixed(0)}%)</h4>
                  <div className="amount-small fee">{formatCurrency(platformFee)}</div>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-header">
                <h3>Biểu đồ doanh thu</h3>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                {renderChart()}
              </ResponsiveContainer>
            </div>
            
            {pieData.some(item => item.value > 0) && (
              <div className="pie-chart-container">
                <h3>Phân bổ doanh thu</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;