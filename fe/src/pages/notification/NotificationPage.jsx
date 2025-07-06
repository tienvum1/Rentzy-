import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NotificationPage.css';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';  

const NotificationPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/vehicles`, { withCredentials: true });
        setVehicles(response.data.vehicles || []);
      } catch (err) {
        setError('Không thể tải danh sách xe.');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Lọc các xe có trạng thái rented hoặc reserved
  const filteredVehicles = vehicles.filter(
    v => v.status === 'rented' || v.status === 'reserved'
  );

  return (
    <div className="notification-container">
      <SidebarOwner />
      <h2 className="notification-title">Thông báo xe đang được thuê hoặc giữ chỗ</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p className="notification-error">{error}</p>}
      {!loading && filteredVehicles.length === 0 && <p className="notification-empty">Không có xe nào đang được thuê hoặc giữ chỗ.</p>}
      {!loading && filteredVehicles.length > 0 && (
        <table className="notification-table">
          <thead>
            <tr>
              <th>Tên xe</th>
              <th>Trạng thái</th>
              <th>Người thuê/Giữ chỗ</th>
              <th>Email</th>
              <th>Số điện thoại</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map(vehicle => (
              <tr key={vehicle._id}>
                <td>{vehicle.brand} {vehicle.model}</td>
                <td>{vehicle.status === 'rented' ? 'Đang được thuê' : 'Đã giữ chỗ'}</td>
                <td>{vehicle.currentRenter?.name || 'N/A'}</td>
                <td>{vehicle.currentRenter?.email || 'N/A'}</td>
                <td>{vehicle.currentRenter?.phone || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NotificationPage; 