import React, { useState } from 'react';
import './VehicleManagement.css'
import AddCarForm from './AddCarForm';
import AddMotorbikeForm from './AddMotorbikeForm';
import axios from 'axios';

const VehicleManagement = () => {
    const [currentView, setCurrentView] = useState('list'); // State to manage the current view
    const [loading, setLoading] = useState(false); // Add loading state
    const [message, setMessage] = useState(null); // Add message state (success/error)
    
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
            const backendUrl = process.env.REACT_APP_BACKEND_URL; // Assuming backend URL is in environment variable
            const apiUrl = `${backendUrl}/api/vehicles/add`;

            const response = await axios.post(apiUrl, data, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for sending files
                },
                 withCredentials: true, // Include cookies (for auth middleware)
            });

            setMessage({ type: 'success', text: response.data.message || 'Vehicle added successfully!' });
            // Optionally reset form or go back to list view
            // setCurrentView('list');
             // For now, just show message and stay on form

        } catch (error) {
            console.error('Error adding vehicle:', error.response?.data || error.message);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add vehicle.' });
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleCancel = () => {
        setCurrentView('selectType'); // Go back to select type view
        setMessage(null); // Clear messages
    };

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
                            onCancel={handleCancel} 
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
                            onCancel={handleCancel} 
                            onSubmit={handleFormSubmit} 
                        />}
                    </>
                );
            default:
                return null; // Or a default error view
        }
    };

    return (
        <div className="vehicle-management-container">
            {renderView()}
        </div>
    );
};

export default VehicleManagement;