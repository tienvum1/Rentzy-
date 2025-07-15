import React, { useState, useEffect } from 'react';
import './VehicleManagement.css'
import axios from 'axios';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehicleManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Add loading state
    const [message, setMessage] = useState(null); // Add message state (success/error)
    const [ownerVehicles, setOwnerVehicles] = useState([]); // State to store the list of owner vehicles
    const [error, setError] = useState(null); // State to store fetch errors for owner vehicles
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999'; // Cung cấp giá trị default

    // Function to fetch danh sách xe từ backend (lấy xe của chủ sở hữu)
    const fetchOwnerVehicles = async () => {
        setLoading(true);
        setError(null); // Reset lỗi trước khi fetch mới
        try {
            // Gọi đúng API lấy xe của chủ sở hữu (dựa vào route backend hiện tại GET /api/vehicles sử dụng getOwnerVehicles)
            const response = await axios.get(`${backendUrl}/api/vehicles/owner`, {
                withCredentials: true, // Quan trọng để gửi cookie chứa token xác thực
            });
            console.log('Fetched owner vehicles:', response.data.vehicles);
            setOwnerVehicles(response.data.vehicles); // Giả định backend trả về { vehicles: [...] }
        } catch (err) {
            console.error('Error fetching owner vehicles:', err);
            setError('Không thể tải danh sách xe của bạn.'); // Thông báo lỗi thân thiện với người dùng
             if (err.response && err.response.data && err.response.data.message) {
                setError(`Không thể tải danh sách xe của bạn: ${err.response.data.message}`);
             }
        } finally {
            setLoading(false);
        }
    };

    // Fetch owner vehicles when the component mounts
    useEffect(() => {
        fetchOwnerVehicles();
    }, []); // Empty dependency array means this runs once on mount

    // Placeholder function for handling edit action
    const handleEdit = async (vehicleId) => {
        console.log('Edit vehicle with ID:', vehicleId);
        // Use navigate to go to the edit page
        navigate(`/ownerpage/edit-vehicle/${vehicleId}`);
    };

    // Thêm hàm chuyển sang trang chi tiết xe
    const handleViewDetail = (vehicleId) => {
        navigate(`/ownerpage/vehicle/${vehicleId}`);
    };

    // Effect to automatically hide messages after a delay
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 3000); // Hide after 3 seconds (3000 milliseconds)

            // Clean up the timer if the component unmounts or message changes
            return () => clearTimeout(timer);
        }
    }, [message]); // Rerun effect when message changes

    // Placeholder for navigation to add car page
    const handleNavigateToAddCar = () => {
        navigate('/ownerpage/add-vehicle'); // Use navigate
        // setMessage({ type: 'info', text: 'Navigate to Add Car page' }); // Remove placeholder message
    };

    const handleToggleLock = async (vehicleId, newStatus) => {
        if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === "blocked" ? "khoá" : "mở khoá"} xe này?`)) {
            try {
                setLoading(true);
                const apiUrl = `${backendUrl}/api/vehicles/${vehicleId}/status`;
                const response = await axios.put(apiUrl, { status: newStatus }, { withCredentials: true });
                toast.success(response.data.message || 'Cập nhật trạng thái xe thành công!');
                fetchOwnerVehicles();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái xe.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="vehicle-management-container">
            <SidebarOwner />
            {/* SidebarOwner không ở đây. Nó nằm trong OwnerPage và hiển thị cố định. */}
            {/* Nội dung của VehicleManagement được hiển thị bên cạnh sidebar. */}
            <div className="vehicle-management-content">
                <h2>Your Vehicles</h2>
                {error && <p className="error">{error}</p>}
                <div className="add-buttons">
                    <button className="btn-add-car" onClick={handleNavigateToAddCar}>+ Thêm xe mới</button>
                </div>
                {loading && <p>Đang tải danh sách xe...</p>}
                {!loading && ownerVehicles.length === 0 && !error && (
                    <p>Bạn chưa có xe nào được đăng.</p>
                )}
                {!loading && ownerVehicles.length > 0 && (
                    <table className="vehicle-table">
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Xe</th>
                                <th>Biển số</th>
                                <th>Giá/Ngày</th>
                                <th>Trạng thái</th>
                                <th>Duyệt</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ownerVehicles.map(vehicle => (
                                <tr key={vehicle._id}>
                                    <td>
                                        {vehicle.primaryImage ? (
                                            <img src={vehicle.primaryImage} alt={`${vehicle.brand} ${vehicle.model}`} style={{ width: '80px', height: 'auto', borderRadius: '4px' }} />
                                        ) : (
                                            <span>No Image</span>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{vehicle.brand}   {vehicle.model}</strong>
                                    </td>
                                    <td>{vehicle.licensePlate}</td>
                                    <td>{vehicle.pricePerDay?.toLocaleString()} VND</td>
                                    <td>{vehicle.status}</td>
                                    <td>{vehicle.approvalStatus}</td>
                                    <td>
                                    <button className="detail-button" onClick={() => handleViewDetail(vehicle._id)}>Xem chi tiết</button>
                                        <button className="edit-button" onClick={() => handleEdit(vehicle._id)}>Sửa</button>
                                        {vehicle.status === "blocked" ? (
                                            <button className="unlock-button" onClick={() => handleToggleLock(vehicle._id, "available")}>Mở khoá</button>
                                        ) : (
                                            <button className="lock-button" onClick={() => handleToggleLock(vehicle._id, "blocked")}>Khoá</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default VehicleManagement;