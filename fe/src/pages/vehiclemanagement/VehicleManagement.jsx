import React, { useState, useEffect } from 'react';
import './VehicleManagement.css'
import AddCarForm from './AddCarForm';
import AddMotorbikeForm from './AddMotorbikeForm';
import axios from 'axios';
import EditCarForm from './EditCarForm';
import EditMotorbikeForm from './EditMotorbikeForm';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';

const VehicleManagement = () => {
    const [currentView, setCurrentView] = useState('list'); // State to manage the current view
    const [loading, setLoading] = useState(false); // Add loading state
    const [message, setMessage] = useState(null); // Add message state (success/error)
    const [vehicles, setVehicles] = useState([]); // State to store the list of vehicles
    const [fetchError, setFetchError] = useState(null); // State to store fetch errors
    const [editingVehicle, setEditingVehicle] = useState(null); // State to store the vehicle being edited
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all'); // State to track vehicle type filter
    const [viewMode, setViewMode] = useState('list'); // State to manage the current view mode
    const [ownerVehicles, setOwnerVehicles] = useState([]); // State to store the list of owner vehicles
    const [error, setError] = useState(null); // State to store fetch errors for owner vehicles
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999'; // Cung cấp giá trị default

    // Function to fetch vehicles from the backend
    const fetchVehicles = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const apiUrl = `${backendUrl}/api/vehicles/`;
            const response = await axios.get(apiUrl, { withCredentials: true });
            setVehicles(response.data.vehicles); // Assuming the backend returns { count: ..., vehicles: [...] }
            console.log('Fetched vehicles data:', response.data.vehicles);
        } catch (error) {
            console.error('Error fetching vehicles:', error.response?.data || error.message);
            setFetchError('Failed to fetch vehicles. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch vehicles when the component mounts and when currentView is 'list'
    useEffect(() => {
        if (currentView === 'list') {
            fetchVehicles();
        }
    }, [currentView]); // Refetch when switching to list view
    
    const handleAddVehicleClick = () => {
        setCurrentView('selectType');
        setMessage(null); // Clear previous messages
    };

    const handleSelectType = (type) => {
        setCurrentView(type === 'Car' ? 'addCar' : 'addMotorbike');
        setMessage(null); // Clear previous messages
    };

    const handleFormSubmit = async (formData) => {
        setLoading(true); // Start loading
        setMessage(null); // Clear previous messages
        setFetchError(null); // Clear fetch errors

        const data = new FormData();
        // Append vehicle common fields
        for (const key in formData) {
            if (key !== 'images') {
                data.append(key, formData[key]);
            }
        }
        // Append vehicle type (needed by backend controller), ensuring lowercase
        data.append('type', currentView === 'addCar' ? 'car' : 'motorbike');

        // Append image files
        formData.images.forEach((file, index) => {
            data.append(`images`, file); // Append each file with the field name 'images'
        });

        try {
            const apiUrl = `${backendUrl}/api/vehicles/add`;

            const response = await axios.post(apiUrl, data, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
                withCredentials: true, // Quan trọng để gửi cookie chứa token xác thực
              });
            console.log('Fetched owner vehicles:', response.data.vehicles);
            setOwnerVehicles(response.data.vehicles);
        } catch (err) {
            console.error('Error fetching owner vehicles:', err);
            setError('Không thể tải danh sách xe.');
             if (err.response && err.response.data && err.response.data.message) {
                setError(`Không thể tải danh sách xe: ${err.response.data.message}`);
             }
        }
        setLoading(false);
    };

    // Sử dụng useEffect để fetch data khi component mount hoặc viewMode trở lại 'list'
    useEffect(() => {
        if (viewMode === 'list') {
            fetchOwnerVehicles();
        }
    }, [viewMode]); // Dependency array: fetch lại khi viewMode thay đổi thành 'list'

    // Hàm xử lý khi nhấn nút "Thêm xe hơi"
    const handleAddCarClick = () => {
        setViewMode('add-car');
    };

    // Hàm xử lý khi nhấn nút "Thêm xe máy"
    const handleAddMotorbikeClick = () => {
        setViewMode('add-motorbike');
    };

    // Hàm xử lý khi nhấn nút "Hủy" trong form
    const handleCancelForm = () => {
        setViewMode('list'); // Trở về chế độ hiển thị danh sách
    };

    // Hàm để fetch danh sách xe từ backend (lấy xe của chủ sở hữu)
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
        }
        setLoading(false);
    };

    // Function to handle vehicle type filter change
    const handleFilterChange = (type) => {
        setVehicleTypeFilter(type);
    };

    // Placeholder function for handling edit action
    const handleEdit = async (vehicleId) => {
        console.log('Edit vehicle with ID:', vehicleId);
        setLoading(true); // Start loading
        setFetchError(null); // Clear previous fetch errors
        setMessage(null); // Clear previous messages
        try {
            const apiUrl = `${backendUrl}/api/vehicles/${vehicleId}`;
            const response = await axios.get(apiUrl, { withCredentials: true });
            setEditingVehicle(response.data.vehicle); // Assuming backend returns { vehicle: {...} }
            setCurrentView('editVehicle'); // Switch to edit view
        } catch (error) {
            console.error('Error fetching vehicle for edit:', error.response?.data || error.message);
            setFetchError('Failed to load vehicle for editing.');
             // Stay on the list view or show an error page
        } finally {
            setLoading(false); // Stop loading
        }
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
                fetchVehicles(); 
            } catch (error) {
                console.error('Error deleting vehicle:', error.response?.data || error.message);
                setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete vehicle.' });
                 setLoading(false); // Stop loading indicator on error
            }
        }
    };

    // Function to handle update form submission
    const handleUpdateSubmit = async (vehicleId, formData) => {
        console.log('Updating vehicle with ID:', vehicleId, 'with data:', formData);
        setLoading(true); // Start loading
        setFetchError(null); // Clear previous fetch errors
        setMessage(null); // Clear previous messages

        // Prepare form data, similar to add vehicle, but potentially handle images differently
        const data = new FormData();
        // Append common vehicle fields
        data.append('brand', formData.brand);
        data.append('model', formData.model);
        data.append('license_plate', formData.license_plate);
        data.append('location', formData.location);
        data.append('is_available', formData.is_available);
        data.append('price_per_day', formData.price_per_day);
        data.append('deposit_required', formData.deposit_required);
        data.append('terms', formData.terms);
        
        // Append specific details based on vehicle type
        if (editingVehicle.type === 'car') {
            data.append('seats', formData.seats);
            data.append('body_type', formData.body_type);
            data.append('transmission', formData.transmission);
            data.append('fuel_type', formData.fuel_type);
        } else if (editingVehicle.type === 'motorbike') {
            data.append('engine_capacity', formData.engine_capacity);
            data.append('has_gear', formData.has_gear);
        }

        // Ensure vehicle type is sent for the backend controller to update specific details
        // We can get the type from the editingVehicle state
        data.append('type', editingVehicle.type === 'car' ? 'car' : 'motorbike');

        try {
            const apiUrl = `${backendUrl}/api/vehicles/${vehicleId}`;
            // Use PUT request for updates
            const response = await axios.put(apiUrl, {
                 // Send formData as JSON body
                 ...formData,
                 type: editingVehicle.type // Ensure type is included
            }, {
                 headers: {
                    'Content-Type': 'application/json', // Set Content-Type to application/json
                 },
                 withCredentials: true, // Include cookies (for auth middleware)
            });

            setMessage({ type: 'success', text: response.data.message || 'Vehicle updated successfully!' });
            setEditingVehicle(null); // Clear editing vehicle state
            // Use setTimeout to hide the message and go back to list view after 2 seconds
            setTimeout(() => {
                setMessage(null); // Hide the message
                setCurrentView('list'); // Go back to list view
                fetchVehicles(); // Refresh the list
            }, 2000); // 2000 milliseconds = 2 seconds

        } catch (error) {
            console.error('Error updating vehicle:', error.response?.data || error.message);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update vehicle.' });
            // On error, also go back to the list view after a delay
            setTimeout(() => {
                setMessage(null); // Hide the message
                setEditingVehicle(null); // Clear editing vehicle state
                setCurrentView('list'); // Go back to list view
                // No need to fetchVehicles here as the update failed
            }, 2000); // 2000 milliseconds = 2 seconds
        } finally {
            setLoading(false); // Stop loading in both success and error cases
        }
    };

    // Effect to automatically hide messages after a delay
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 2000); // Hide after 2 seconds (2000 milliseconds)

            // Clean up the timer if the component unmounts or message changes
            return () => clearTimeout(timer);
        }
    }, [message]); // Rerun effect when message changes

    const renderView = () => {
        switch (currentView) {
            case 'list':
                return (
                    <div>
                        <h2>Vehicle Management</h2>
                        {message && <p className={`message ${message.type}`}>{message.text}</p>}
                        <button onClick={handleAddVehicleClick}>Thêm phương tiện</button>
                        {/* Future: Display list of vehicles here */}
                    </div>
                );
            case 'selectType':
                return (
                    <div>
                        <h2>Chọn loại phương tiện</h2>
                        {message && <p className={`message ${message.type}`}>{message.text}</p>}
                        <button onClick={() => handleSelectType('Car')}>Car</button>
                        <button onClick={() => handleSelectType('Motorbike')}>Motorbike</button>
                    </div>
                );
            case 'addCar':
                return (
                    <>
                        {message && <p className={`message ${message.type}`}>{message.text}</p>}
                        {loading && <p>Adding vehicle...</p>}
                        {!loading && <AddCarForm 
                            onCancel={handleCancelForm} 
                            onSubmit={handleFormSubmit} 
                        />}
                    </>
                );
            case 'addMotorbike':
                return (
                    <>
                        {message && <p className={`message ${message.type}`}>{message.text}</p>}
                        {loading && <p>Adding vehicle...</p>}
                        {!loading && <AddMotorbikeForm 
                            onCancel={handleCancelForm} 
                            onSubmit={handleFormSubmit} 
                        />}
                    </>
                );
            default:
                return (
                    <div className="vehicle-list-view">
                        <h2>Your Vehicles</h2>
                         <div className="add-buttons">
                            <button className="btn-add-car" onClick={handleAddCarClick}>+ Add New Car</button>
                            <button className="btn-add-motorbike" onClick={handleAddMotorbikeClick}>+ Add New Motorbike</button>
                        </div>
                         <p>Đang tải danh sách xe...</p>
                    </div>
                );
        }
    };

    return (
        <div className="vehicle-management-container">
            <SidebarOwner />
            {/* SidebarOwner không ở đây. Nó nằm trong OwnerPage và hiển thị cố định. */}
            {/* Nội dung của VehicleManagement được hiển thị bên cạnh sidebar. */}
            <div className="vehicle-management-content">
                {renderView()}
            </div>
        </div>
    );
};

export default VehicleManagement;