import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import moment from 'moment';
import './OwnerBookingManagement.css';
import './OwnerActionButtons.css';

const OwnerBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${backendUrl}/api/owner/owner-bookings`, { withCredentials: true });
        if (res.data.success) {
          setBookings(res.data.bookings);
        } else {
          setError(res.data.message || 'Không thể tải danh sách đơn thuê.');
        }
      } catch (err) {
        setError('Không thể tải danh sách đơn thuê.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  const handleSortToggle = () => setSortAsc((s) => !s);
  const handleSearchChange = (e) => setSearch(e.target.value);

  const filteredBookings = bookings.filter(b => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    const brand = b.vehicle?.brand?.toLowerCase() || '';
    const model = b.vehicle?.model?.toLowerCase() || '';
    return brand.includes(keyword) || model.includes(keyword);
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return sortAsc
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'status') {
      return sortAsc
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  return (
    <div className="owner-booking-layout">
      <SidebarOwner />
      <div className="owner-booking-content">
        <div className="owner-booking-sortbar">
          <label>Sắp xếp:&nbsp;</label>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="owner-booking-sort-select"
          >
            <option value="createdAt">Ngày tạo</option>
            <option value="status">Trạng thái</option>
          </select>
          <button onClick={handleSortToggle} className="owner-booking-sort-btn">
            {sortAsc ? '↑' : '↓'}
          </button>
          <input
            type="text"
            className="owner-booking-search-input"
            placeholder="Tìm kiếm tên xe..."
            value={search}
            onChange={handleSearchChange}
            style={{ marginLeft: 16, minWidth: 180 }}
          />
        </div>
        <h2 className="owner-booking-title">Quản lý đơn thuê</h2>
        {loading && <p>Đang tải...</p>}
        {error && <p className="owner-booking-error">{error}</p>}
        {!loading && bookings.length === 0 && <p className="owner-booking-empty">Bạn chưa có đơn thuê nào.</p>}
        {!loading && bookings.length > 0 && (
          <div className="owner-booking-table-wrapper">
            <table className="owner-booking-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Xe</th>
                  <th>Khách thuê</th>
                  <th>Trạng thái</th>
                  <th>Giờ & Ngày thuê</th>
                  <th>Ngày tạo</th>
                  <th>Giải ngân</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sortedBookings.map((b) => (
                  <tr key={b._id}>
                    <td>#{b._id.slice(-6)}</td>
                    <td>{b.vehicle?.brand} {b.vehicle?.model}</td>
                    <td>{b.renter?.name || b.renter?.email}</td>
                    <td>{b.status}</td>
                    <td>
                      {b.pickupTime} {moment(b.startDate).format('DD/MM/YYYY')}  {b.returnTime} {moment(b.endDate).format('DD/MM/YYYY')}
                    </td>
                    <td>{moment(b.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                    <td>
                      {b.payoutStatus === 'none' && <span className="payout-status payout-status-none">Chưa đến bước</span>}
                      {b.payoutStatus === 'pending' && <span className="payout-status payout-status-pending">Chờ duyệt</span>}
                      {b.payoutStatus === 'approved' && <span className="payout-status payout-status-approved">Đã giải ngân</span>}
                      {b.payoutStatus === 'rejected' && <span className="payout-status payout-status-rejected">Từ chối</span>}
                    </td>
                    <td>
                      <div className="owner-booking-action-group">
                        <a
                          className="owner-booking-action-btn view"
                          href={`/ownerpage/booking-detail/${b._id}`}
                        >
                          {/* <FaEye style={{marginRight: 6}} /> */} Xem
                        </a>
                        <a
                          className="owner-booking-action-btn contract"
                          href={`/ownerpage/contract/${b._id}`}
                        >
                          {/* <FaFileContract style={{marginRight: 6}} /> */} Hợp đồng
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBookingManagement; 