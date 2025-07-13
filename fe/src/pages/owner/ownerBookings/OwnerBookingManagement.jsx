import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import moment from 'moment';
import './OwnerBookingManagement.css';

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

  return (
    <div className="owner-booking-layout">
      <SidebarOwner />
      <div className="owner-booking-content">
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
                  <th>Giờ & Ngày  thuê</th>
                  <th>Giải ngân</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>#{b._id.slice(-6)}</td>
                    <td>{b.vehicle?.brand} {b.vehicle?.model}</td>
                    <td>{b.renter?.name || b.renter?.email}</td>
                    <td>{b.status}</td>
                    <td>
                    {b.pickupTime} {moment(b.startDate).format('DD/MM/YYYY')} - {b.returnTime} {moment(b.endDate).format('DD/MM/YYYY')}
                    </td>
                    <td>
                      {b.payoutStatus === 'none' && <span className="payout-status payout-status-none">Chưa đến bước</span>}
                      {b.payoutStatus === 'pending' && <span className="payout-status payout-status-pending">Chờ duyệt</span>}
                      {b.payoutStatus === 'approved' && <span className="payout-status payout-status-approved">Đã giải ngân</span>}
                      {b.payoutStatus === 'rejected' && <span className="payout-status payout-status-rejected">Từ chối</span>}
                    </td>
                    <td>
                      <a className="owner-booking-view-link" href={`/ownerpage/booking-detail/${b._id}`}>Xem</a>
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