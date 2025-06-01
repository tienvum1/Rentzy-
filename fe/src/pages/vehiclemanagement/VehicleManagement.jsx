import React, { useState, useEffect } from 'react';
import './VehicleManagement.css'
import AddCarForm from './AddCarForm';
import AddMotorbikeForm from './AddMotorbikeForm';
import axios from 'axios';
import EditCarForm from './EditCarForm';
import EditMotorbikeForm from './EditMotorbikeForm';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';
import { useNavigate } from 'react-router-dom';

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
            const response = await axios.get(`${backendUrl}/api/vehicles`, {
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
        navigate(`/edit-vehicle/${vehicleId}`); // Example path for edit page
         // setMessage({ type: 'info', text: `Navigate to edit page for vehicle ID: ${vehicleId}` }); // Remove placeholder message
    };

    // Placeholder function for handling delete action
    const handleDelete = async (vehicleId) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                setLoading(true); // Start loading indicator if desired
                const apiUrl = `${backendUrl}/api/vehicles/${vehicleId}`;
                const response = await axios.delete(apiUrl, { withCredentials: true });
                setMessage({ type: 'success', text: response.data.message || 'Vehicle deleted successfully!' });
                // After successful deletion, refresh the vehicle list
                fetchOwnerVehicles(); // Refresh owner's vehicle list
                setLoading(false); // Stop loading indicator
            } catch (error) {
                console.error('Error deleting vehicle:', error.response?.data || error.message);
                setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete vehicle.' });
                setLoading(false); // Stop loading indicator on error
            }
        } else {
            // User cancelled deletion
        }
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
        navigate('/ownerpage/add-car'); // Use navigate
        // setMessage({ type: 'info', text: 'Navigate to Add Car page' }); // Remove placeholder message
    };

    // Placeholder for navigation to add motorbike page
    const handleNavigateToAddMotorbike = () => {
        navigate('/ownerpage/add-motorbike'); // Use navigate
        // setMessage({ type: 'info', text: 'Navigate to Add Motorbike page' }); // Remove placeholder message
    };

    return (
        <div className="vehicle-management-container">
            <SidebarOwner />
            {/* SidebarOwner không ở đây. Nó nằm trong OwnerPage và hiển thị cố định. */}
            {/* Nội dung của VehicleManagement được hiển thị bên cạnh sidebar. */}
            <div className="vehicle-management-content">
                <h2>Your Vehicles</h2>
                {message && <p className={`message ${message.type}`}>{message.text}</p>}
                {error && <p className="error">{error}</p>}
                <div className="add-buttons">
                    <button className="btn-add-car" onClick={handleNavigateToAddCar}>+ Add New Car</button>
                    <button className="btn-add-motorbike" onClick={handleNavigateToAddMotorbike}>+ Add New Motorbike</button>
                </div>
                {loading && <p>Đang tải danh sách xe...</p>}
                {!loading && ownerVehicles.length === 0 && !error && (
                    <p>Bạn chưa có xe nào được đăng.</p>
                )}
                {!loading && ownerVehicles.length > 0 && (
                    <table className="vehicle-table">
                        <thead>
                            <tr>
                                <th>Ảnh chính</th>
                                <th>Thông tin xe</th>
                                <th>Biển số</th>
                                <th>Địa điểm</th>
                                <th>Giá/Ngày</th>
                                <th>Trạng thái</th>
                                <th>Duyệt bởi Admin</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ownerVehicles.map(vehicle => (
                                <tr key={vehicle._id}>
                                    <td>
                                        {vehicle.primaryImage ? (
                                            <img src={vehicle.primaryImage} alt={`${vehicle.brand} ${vehicle.model} primary`} style={{ width: '80px', height: 'auto', borderRadius: '4px' }} />
                                        ) : (
                                            <span>No Image</span>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{vehicle.brand} {vehicle.model}</strong> ({vehicle.type})
                                        {vehicle.type === 'car' && vehicle.specificDetails && (
                                            <>
                                                <br />Số chỗ: {vehicle.specificDetails.seatCount}
                                                <br />Thân xe: {vehicle.specificDetails.bodyType}
                                                <br />Hộp số: {vehicle.specificDetails.transmission}
                                                <br />Nhiên liệu: {vehicle.specificDetails.fuelType}
                                            </>
                                        )}
                                        {vehicle.type === 'motorbike' && vehicle.specificDetails && (
                                            <>
                                                <br />Dung tích: {vehicle.specificDetails.engineCapacity} cc
                                                <br />Có số: {vehicle.specificDetails.hasGear ? 'Có' : 'Không'}
                                            </>
                                        )}
                                    </td>
                                    <td>{vehicle.licensePlate}</td>
                                    <td>{vehicle.location}</td>
                                    <td>{vehicle.pricePerDay} VND</td>
                                    <td>{vehicle.status}</td>
                                    <td>{vehicle.approvalStatus}</td>
                                    <td>
                                        <button className="edit-button" onClick={() => handleEdit(vehicle._id)}>Edit</button>
                                        <button className="delete-button" onClick={() => handleDelete(vehicle._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VehicleManagement;