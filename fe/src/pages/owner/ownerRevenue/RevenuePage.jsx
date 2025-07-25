import React, { useEffect, useState, useMemo } from 'react';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import './RevenuePage.css';
import { DatePicker } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

const typeOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const RevenuePage = () => {
  const [type, setType] = useState('month');
  const [revenueData, setRevenueData] = useState([]);
  const [total, setTotal] = useState(0);
  const [grossTotal, setGrossTotal] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [platformFeeRate, setPlatformFeeRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewType, setViewType] = useState('monthly'); // 'daily' or 'monthly'



  // Helper để lấy start/end theo type
  const getRange = useMemo(() => {
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
  }, [type, selectedDate]);

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      setError('');
      try {
        let url = `${API_URL}/api/owner/revenue?type=${type}`;
        const { start, end } = getRange;
        if (start && end) url += `&start=${start}&end=${end}`;
        
        const res = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await res.json();
        if (data.success) {
          setRevenueData(data.revenue || []);
          setTotal(data.total?.totalRevenue || 0);
          setGrossTotal(data.total?.grossRevenue || 0);
          setPlatformFee(data.total?.platformFee || 0);
          setPlatformFeeRate(data.platformFeeRate || 0.1);
        } else {
          setError(data.message || 'Lỗi khi lấy dữ liệu doanh thu');
          setRevenueData([]);
        }
      } catch (err) {
        console.error('Revenue fetch error:', err);
        setError('Lỗi kết nối server');
        setRevenueData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRevenue();
  }, [type, getRange]);



  // Prepare chart data based on view type
  const chartData = useMemo(() => {
    if (!revenueData || revenueData.length === 0) {
      return [];
    }

    let processedData = [];
    
    if (viewType === 'monthly') {
      // Create 12 months data for the selected year
      const year = selectedDate.year();
      
      // Initialize all 12 months with zero values
      for (let month = 1; month <= 12; month++) {
        processedData.push({
          period: `${year}-${String(month).padStart(2, '0')}`,
          displayPeriod: monthNames[month - 1],
          bookingCount: 0,
          revenue: 0,
          grossRevenue: 0,
          platformFee: 0
        });
      }
      
      // Fill in actual data if available
      revenueData.forEach(item => {
        let monthIndex = -1;
        
        // Handle different data structures from backend
        if (item._id && typeof item._id.month === 'number') {
          monthIndex = item._id.month - 1;
        } else if (item.date) {
          const date = new Date(item.date);
          if (!isNaN(date.getTime())) {
            monthIndex = date.getMonth();
          }
        } else if (item.period) {
          const periodDate = new Date(item.period);
          if (!isNaN(periodDate.getTime())) {
            monthIndex = periodDate.getMonth();
          }
        }
        
        if (monthIndex >= 0 && monthIndex < 12) {
          const revenue = item.totalRevenue || item.revenue || 0;
          const grossRevenue = item.grossRevenue || revenue || 0;
          const platformFee = item.platformFee || (grossRevenue * platformFeeRate) || 0;
          
          processedData[monthIndex] = {
            ...processedData[monthIndex],
            bookingCount: item.count || item.bookingCount || 0,
            revenue: Math.max(0, revenue),
            grossRevenue: Math.max(0, grossRevenue),
            platformFee: Math.max(0, platformFee)
          };
        }
      });
    } else {
      // Daily view - show all days in the selected period
      const { start, end } = getRange;
      if (!start || !end) return [];
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
      }
      
      // Create array of all dates in the range
      const dateArray = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Initialize all dates with zero values
      processedData = dateArray.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return {
          period: dateStr,
          displayPeriod: date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit'
          }),
          bookingCount: 0,
          revenue: 0,
          grossRevenue: 0,
          platformFee: 0
        };
      });
      
      // Fill in actual data if available
      revenueData.forEach(item => {
        let targetDate = null;
        
        // Handle different data structures from backend
        if (item._id && item._id.day && item._id.month && item._id.year) {
          targetDate = new Date(item._id.year, item._id.month - 1, item._id.day);
        } else if (item.date) {
          targetDate = new Date(item.date);
        } else if (item.period) {
          targetDate = new Date(item.period);
        }
        
        if (targetDate && !isNaN(targetDate.getTime())) {
          const dateStr = targetDate.toISOString().split('T')[0];
          const dataIndex = processedData.findIndex(d => d.period === dateStr);
          
          if (dataIndex >= 0) {
            const revenue = item.totalRevenue || item.revenue || 0;
            const grossRevenue = item.grossRevenue || revenue || 0;
            const platformFee = item.platformFee || (grossRevenue * platformFeeRate) || 0;
            
            processedData[dataIndex] = {
              ...processedData[dataIndex],
              bookingCount: item.count || item.bookingCount || 0,
              revenue: Math.max(0, revenue),
              grossRevenue: Math.max(0, grossRevenue),
              platformFee: Math.max(0, platformFee)
            };
          }
        }
      });
    }
    
    return processedData;
  }, [revenueData, viewType, selectedDate, getRange, platformFeeRate]);



  // Định dạng số tiền
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 VND';
    return value.toLocaleString('vi-VN') + ' VND';
  };

  // Định dạng số tiền ngắn gọn cho biểu đồ
  const formatCurrencyShort = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return new Intl.NumberFormat('vi-VN', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };



  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p className="tooltip-label" style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: '#333'
          }}>
            {`Thời gian: ${label}`}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color,
              margin: '4px 0',
              fontSize: '14px'
            }}>
              {`${entry.name}: ${entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('fee') ? 
                formatCurrency(entry.value) : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Định dạng ngày tháng
  const renderDatePicker = () => {
    const commonProps = {
      value: selectedDate,
      onChange: setSelectedDate,
      allowClear: false,
      style: { width: '100%' }
    };

    switch (type) {
      case 'day':
        return <DatePicker {...commonProps} format="DD/MM/YYYY" />;
      case 'month':
        return <DatePicker {...commonProps} picker="month" format="MM/YYYY" />;
      case 'year':
        return <DatePicker {...commonProps} picker="year" format="YYYY" />;
      default:
        return null;
    }
  };

  // Kiểm tra xem có dữ liệu không
  const hasData = chartData && chartData.length > 0 && chartData.some(item => 
    item.revenue > 0 || item.grossRevenue > 0 || item.bookingCount > 0
  );

  return (
    <div className="revenue-layout">
      <SidebarOwner />
      <div className="revenue-container">
        <div className="revenue-content improved">
          <h1>Doanh thu của bạn</h1>
        <div className="revenue-filter-bar">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="viewType">Hiển thị biểu đồ theo:</label>
              <select
                id="viewType"
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                className="view-type-select"
                disabled={loading}
              >
                <option value="daily">Ngày</option>
                <option value="monthly">Tháng</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="type-select">Loại thống kê:</label>
              <select 
                id="type-select"
                value={type} 
                onChange={(e) => {
                  setType(e.target.value);
                  // Auto-adjust view type based on selection
                  if (e.target.value === 'year') {
                    setViewType('monthly');
                  } else if (e.target.value === 'day') {
                    setViewType('daily');
                  }
                }}
                className="revenue-select"
                disabled={loading}
              >
                <option value="day">Theo ngày</option>
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="date-picker">Chọn thời gian:</label>
              <div className="date-picker-wrapper">
                {renderDatePicker()}
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Thử lại
            </button>
          </div>
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
            {/* Revenue Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3>Biểu đồ doanh thu {viewType === 'daily' ? 'theo ngày' : 'theo tháng'}</h3>
                {hasData && (
                  <div className="chart-info">
                    <span className="data-points">Hiển thị {chartData.length} điểm dữ liệu</span>
                  </div>
                )}
              </div>
              
              {!hasData ? (
                <div className="no-data">
                  <div className="no-data-icon">📊</div>
                  <p>Không có dữ liệu doanh thu trong khoảng thời gian này</p>
                  <small>Hãy thử chọn khoảng thời gian khác hoặc kiểm tra lại dữ liệu</small>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    barCategoryGap="10%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                      stroke="#666"
                      interval={0}
                    />
                    <YAxis 
                      tickFormatter={formatCurrencyShort}
                      fontSize={11}
                      stroke="#666"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      dataKey="grossRevenue" 
                      name="Doanh thu gốc" 
                      fill="#3b82f6" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar 
                      dataKey="platformFee" 
                      name="Phí platform" 
                      fill="#ef4444" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Doanh thu thực nhận" 
                      fill="#10b981" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Booking Count Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3>Số lượng booking {viewType === 'daily' ? 'theo ngày' : 'theo tháng'}</h3>
                {hasData && (
                  <div className="chart-info">
                    <span className="total-bookings">
                      Tổng: {chartData.reduce((sum, item) => sum + (item.bookingCount || 0), 0)} booking
                    </span>
                  </div>
                )}
              </div>
              
              {!hasData ? (
                <div className="no-data">
                  <div className="no-data-icon">📅</div>
                  <p>Không có dữ liệu booking trong khoảng thời gian này</p>
                  <small>Hãy thử chọn khoảng thời gian khác hoặc kiểm tra lại dữ liệu</small>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    barCategoryGap="10%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                      stroke="#666"
                      interval={0}
                    />
                    <YAxis 
                      fontSize={11}
                      stroke="#666"
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Thời gian: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="bookingCount" 
                      name="Số booking" 
                      fill="#8b5cf6" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>


          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;