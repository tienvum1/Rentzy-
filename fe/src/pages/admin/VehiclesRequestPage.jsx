// fe/src/pages/admin/VehicleApprovalPage.jsx
import React, { useState, useEffect } from 'react';
import './VehiclesRequestPage.css'; // Tái sử dụng CSS cho bảng nếu phù hợp, hoặc tạo CSS riêng
import axios from 'axios';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin'; // Import SidebarAdmin
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';
const VehiclesRequestPage = () => {
    // State để lưu danh sách xe chờ duyệt
    const [pendingVehicles, setPendingVehicles] = useState([]);
    // State để quản lý trạng thái loading
    const [loading, setLoading] = useState(true);
    // State để lưu lỗi nếu có
    const [error, setError] = useState(null);

    // Hàm để fetch danh sách xe chờ duyệt từ backend
    const fetchPendingVehicleApprovals = async () => {
        setLoading(true);
        setError(null); // Reset lỗi trước khi fetch mới
        try {

            const response = await axios.get(`${backendUrl}/api/vehicles/admin/pending-approvals`, {
                withCredentials: true,
              });
            console.log('Fetched pending vehicles:', response.data.vehicles);
            setPendingVehicles(response.data.vehicles);
        } catch (err) {
            console.error('Error fetching pending vehicle approvals:', err);
            setError('Không thể tải danh sách yêu cầu duyệt xe.');
             if (err.response && err.response.data && err.response.data.message) {
                setError(`Không thể tải danh sách yêu cầu duyệt xe: ${err.response.data.message}`);
             }
        }
        setLoading(false);
    };

    // Sử dụng useEffect để fetch data khi component mount
    useEffect(() => {
        fetchPendingVehicleApprovals();
    }, []); // Dependency array trống: chỉ fetch một lần khi mount

    const handleApproveReject = async (vehicleId, status) => {
        console.log(`Reviewing vehicle ${vehicleId} with status ${status}`);
        // Implement API call to update vehicle approvalStatus
        try {
            // Example API call (you need to create this backend endpoint: PUT /api/vehicles/:id/approve or similar)
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/vehicles/${vehicleId}/approve`, { status }, { withCredentials: true });
            console.log('Vehicle review successful:', response.data);
            alert(`Xe ${vehicleId} đã được ${status === 'approved' ? 'duyệt' : 'từ chối'}.`);
            // Refresh the list after review
            fetchPendingVehicleApprovals();
        } catch (error) {
            console.error('Error reviewing vehicle:', error);
            alert('Có lỗi xảy ra khi xử lý yêu cầu duyệt xe!');
        }
    };

    // Hàm render nội dung chính (chỉ hiển thị bảng)
    const renderContent = () => {
        return (
            <div className="vehicle-list-view"> {/* Tái sử dụng class CSS nếu phù hợp */}
                <h2>Yêu cầu Duyệt Xe</h2>
                {/* Remove add buttons */}
                {/* <div className="add-buttons">...</div> */}

                {/* Khu vực hiển thị danh sách xe chờ duyệt dưới dạng bảng */}
                {loading ? (
                    <p>Đang tải danh sách yêu cầu duyệt xe...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : pendingVehicles.length === 0 ? (
                    <p>Không có yêu cầu duyệt xe nào.</p>
                ) : (
                    <table className="vehicles-table"> {/* Tái sử dụng class CSS cho bảng */}
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Thương hiệu</th>
                                <th>Model</th>
                                <th>Biển số</th>
                                <th>Chủ xe</th> {/* Thêm cột thông tin chủ xe */}
                                <th>Loại xe</th>
                                <th>Giá/Ngày</th>
                                <th>Trạng thái</th>
                                <th>Trạng thái duyệt</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingVehicles.map((vehicle) => (
                                <tr key={vehicle._id}>
                                    <td>
                                        {vehicle.primaryImage ? (
                                            <img src={vehicle.primaryImage} style={{width: '100px', height: '100px'}} alt={`Ảnh xe ${vehicle.brand} ${vehicle.model}`} className="vehicle-thumbnail" />
                                        ) : (
                                            'Không ảnh'
                                        )}
                                    </td>
                                    <td>{vehicle.brand}</td>
                                    <td>{vehicle.model}</td>
                                    <td>{vehicle.licensePlate}</td>
                                    <td>{vehicle.owner ? `${vehicle.owner.name} (${vehicle.owner.email})` : 'N/A'}</td> {/* Hiển thị thông tin chủ xe */}
                                    <td>{vehicle.type === 'car' ? 'Ô tô' : 'Xe máy'}</td>
                                    <td>{vehicle.pricePerDay ? vehicle.pricePerDay.toLocaleString() + ' VNĐ' : 'N/A'}</td> {/* Add check for pricePerDay */}
                                    <td>{vehicle.status}</td>
                                    <td>{vehicle.approvalStatus}</td>
                                    <td>
                                        {/* Nút hành động Duyệt/Từ chối */}
                                        {vehicle.approvalStatus === 'pending' && (
                                            <>
                                                <button className="btn-action btn-success" onClick={() => handleApproveReject(vehicle._id, 'approved')}>Duyệt</button>
                                                <button className="btn-action btn-danger" onClick={() => handleApproveReject(vehicle._id, 'rejected')}>Từ chối</button>
                                            </>
                                        )}
                                        {/* Optionally show view details button for approved/rejected */}
                                        {/* <button className="btn-action btn-info">Xem chi tiết</button> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    return (
        <div className="vehicle-management-container"> {/* Tái sử dụng container chính */}
            <SidebarAdmin /> {/* Sử dụng SidebarAdmin */}
            <div className="vehicle-management-content"> {/* Tái sử dụng content div */}
                {renderContent()}
            </div>
        </div>
    );
};

// Export component với tên mới
export default VehiclesRequestPage;