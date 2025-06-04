import React, { useState, useEffect } from 'react';
import './VehiclesRequestPage.css'; // Tái sử dụng CSS cho bảng nếu phù hợp, hoặc tạo CSS riêng
import './AdminDashboard.css'; // Import Admin Dashboard layout styles
import axios from 'axios';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin'; // Import SidebarAdmin

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

const VehiclesRequestPage = () => {
    // State để lưu danh sách xe chờ duyệt
    const [pendingVehicles, setPendingVehicles] = useState([]);
    // State để quản lý trạng thái loading của toàn trang
    const [loading, setLoading] = useState(true);
    // State để lưu lỗi nếu có
    const [error, setError] = useState(null);
    // State để quản lý trạng thái loading cho từng hành động (duyệt/từ chối)
    const [actionLoading, setActionLoading] = useState({});
    // State để lưu lý do từ chối cho từng xe
    const [rejectionReason, setRejectionReason] = useState({});
    // State để quản lý modal xem ảnh
    const [modalImage, setModalImage] = useState(null);

    // Hàm để fetch danh sách xe chờ duyệt từ backend
    const fetchPendingVehicleApprovals = async () => {
        setLoading(true);
        setError(null); // Reset lỗi trước khi fetch mới
        try {

            // Corrected API endpoint based on backend routes
            const response = await axios.get(`${backendUrl}/api/vehicles/admin/pending-approvals`, {
                withCredentials: true,
              });
            console.log('Fetched pending vehicles:', response.data.vehicles);
            setPendingVehicles(response.data.vehicles);
        } catch (err) {
            console.error('Error fetching pending vehicle approvals:', err);
            // Display error message from backend if available
             setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu duyệt xe.');
        }
        setLoading(false);
    };

    // Sử dụng useEffect để fetch data khi component mount
    useEffect(() => {
        fetchPendingVehicleApprovals();
    }, []); // Dependency array trống: chỉ fetch một lần khi mount

    const handleReview = async (vehicleId, status) => {
        console.log(`Reviewing vehicle ${vehicleId} with status ${status}`);
        setActionLoading(prev => ({ ...prev, [vehicleId]: true })); // Set loading for this specific vehicle
        setError(null); // Clear main error message

        const payload = { status };
        // Include rejection reason if status is rejected
        if (status === 'rejected') {
            const reason = rejectionReason[vehicleId] || '';
            // Optional: Require a reason for rejection
            // if (!reason.trim()) {
            //     setError('Vui lòng nhập lý do từ chối.');
            //     setActionLoading(prev => ({ ...prev, [vehicleId]: false }));
            //     return;
            // }
            payload.rejectionReason = reason;
        }

        try {
            // Corrected API endpoint based on backend routes
            const response = await axios.put(`${backendUrl}/api/vehicles/admin/vehicles/review/${vehicleId}`, payload, { withCredentials: true });
            
            if (response.status === 200) {
                 console.log('Vehicle review successful:', response.data);
                 // Remove the reviewed vehicle from the list
                 setPendingVehicles(pendingVehicles.filter(vehicle => vehicle._id !== vehicleId));
                 alert(response.data.message);
            } else {
                 // Handle other success status codes if necessary
                 console.log('Vehicle review returned non-200 status:', response.status, response.data);
                 setError(response.data.message || 'Đã xảy ra lỗi khi duyệt xe.');
            }

        } catch (error) {
            console.error('Error reviewing vehicle:', error);
            // Display error message from backend if available
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu duyệt xe!');
        }
        setActionLoading(prev => ({ ...prev, [vehicleId]: false })); // Clear loading for this specific vehicle
    };

     // Handler for rejection reason input change
     const handleReasonChange = (vehicleId, value) => {
        setRejectionReason(prev => ({ ...prev, [vehicleId]: value }));
    };

    // Handler for opening the image modal
    const openModal = (imageUrl) => {
        setModalImage(imageUrl);
    };

    // Handler for closing the image modal
    const closeModal = () => {
        setModalImage(null);
    };

    // Hàm render nội dung chính (bảng hoặc thông báo)
    const renderContent = () => {
         if (loading) return <p>Đang tải danh sách yêu cầu duyệt xe...</p>;
         if (error) return <p className="error-message">Lỗi: {error}</p>;

        if (pendingVehicles.length === 0) return (
            <div className="no-requests-message-container"> {/* Styled container for no requests */}
                <p>Không có yêu cầu duyệt xe nào.</p>
            </div>
        );

        return (
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
                                    <img
                                        src={vehicle.primaryImage}
                                        alt={`Ảnh xe ${vehicle.brand} ${vehicle.model}`}
                                        className="vehicle-thumbnail"
                                        onClick={() => openModal(vehicle.primaryImage)} // Open modal on click
                                    />
                                ) : (
                                    'Không ảnh'
                                )}
                            </td>
                            <td>{vehicle.brand}</td>
                            <td>{vehicle.model}</td>
                            <td>{vehicle.licensePlate}</td>
                            {/* Display owner name and email (handle case where ownerDetails might be missing/null) */}
                            <td>{vehicle.owner ? `${vehicle.owner.name} (${vehicle.owner.email})` : 'N/A'}</td> 
                            <td>{vehicle.type === 'car' ? 'Ô tô' : 'Xe máy'}</td>
                             {/* Format price and deposit */} {/* Ensure pricePerDay and deposit are numbers */} 
                            <td>{vehicle.pricePerDay ? parseFloat(vehicle.pricePerDay).toLocaleString() + ' VNĐ' : 'N/A'}</td>
                             {/* Assuming status is vehicle status like 'available', 'booked' etc. */}
                            <td>{vehicle.status}</td> 
                             {/* Display current approval status */}
                            <td>{vehicle.approvalStatus}</td>
                            <td>
                                 {/* Action buttons and reason input */}
                                {actionLoading[vehicle._id] ? (
                                    'Đang xử lý...'
                                ) : (
                                     vehicle.approvalStatus === 'pending' ? (
                                        <>
                                            <button className="btn-action btn-success" onClick={() => handleReview(vehicle._id, 'approved')}>Duyệt</button>
                                            <button className="btn-action btn-danger" onClick={() => handleReview(vehicle._id, 'rejected')}>Từ chối</button>
                                            {/* Input for rejection reason, shown below buttons or toggle visibility */}
                                            <input
                                                 type="text"
                                                 placeholder="Lý do từ chối (nếu có)"
                                                 value={rejectionReason[vehicle._id] || ''}
                                                 onChange={(e) => handleReasonChange(vehicle._id, e.target.value)}
                                                 className="rejection-reason-input" // Add a class for styling
                                            />
                                        </>
                                     ) : (
                                         // Optionally display current status or action buttons for other statuses
                                         <p>{vehicle.approvalStatus}</p> // Show current status if not pending
                                     )
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="admin-dashboard-layout"> {/* Use admin layout class */}
            <SidebarAdmin /> {/* Use SidebarAdmin */}
            <div className="admin-dashboard-content"> {/* Use admin content class */}
                <div className="vehicles-requests-inner-content"> {/* Inner wrapper for page-specific content */}
                     <h2>Yêu cầu Duyệt Xe</h2>
                    {renderContent()} {/* Render loading, error, empty, or table */}
                </div>
            </div>

             {/* Image Modal */}
             {modalImage && (
                <div className="modal-backdrop" onClick={closeModal}> {/* Use modal backdrop style */}
                     <img src={modalImage} alt="Vehicle Preview" className="modal-image" /> {/* Use modal image style */}
                </div>
             )}
        </div>
    );
};

// Export component
export default VehiclesRequestPage;