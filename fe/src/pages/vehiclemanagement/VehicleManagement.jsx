import React, { useState, useEffect } from 'react';
import './VehicleManagement.css'
import AddCarForm from './AddCarForm';
import AddMotorbikeForm from './AddMotorbikeForm';
import axios from 'axios';
import EditCarForm from './EditCarForm';
import EditMotorbikeForm from './EditMotorbikeForm';

const VehicleManagement = () => {
    const [currentView, setCurrentView] = useState('list'); // State to manage the current view
    const [loading, setLoading] = useState(false); // Add loading state
    const [message, setMessage] = useState(null); // Add message state (success/error)
    const [vehicles, setVehicles] = useState([]); // State to store the list of vehicles
    const [fetchError, setFetchError] = useState(null); // State to store fetch errors
    const [editingVehicle, setEditingVehicle] = useState(null); // State to store the vehicle being edited
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all'); // State to track vehicle type filter

    // Function to fetch vehicles from the backend
    const fetchVehicles = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
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
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
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
             // Use setTimeout to hide the message and go back to list view after 2 seconds
             setCurrentView('list'); // Go back to list view immediately after setting message
             setTimeout(() => {
                 setMessage(null); // Hide the message
                 // Reset form state if necessary before changing view
                 // For simplicity, we'll just change the view and refetch
                 fetchVehicles(); // Refresh the list
             }, 2000); // 2000 milliseconds = 2 seconds

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
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
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
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
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
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
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
                        <h3>List vehicle</h3>
                        <div className="filter-buttons">
                            <button 
                                className={vehicleTypeFilter === 'car' ? 'active' : ''}
                                onClick={() => handleFilterChange('car')}
                            >
                                Cars
                            </button>
                            <button 
                                className={vehicleTypeFilter === 'motorbike' ? 'active' : ''}
                                onClick={() => handleFilterChange('motorbike')}
                            >
                                Motorbikes
                            </button>
                        </div>
                        {loading && <p>Loading vehicles...</p>}
                        {fetchError && <p className="message error">{fetchError}</p>}
                        {!loading && !fetchError && (
                            // Render table only if a specific filter is selected and there are vehicles matching the filter
                            vehicleTypeFilter !== 'all' && 
                            vehicles.filter(vehicle => vehicle.type === vehicleTypeFilter).length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Type</th>
                                        <th>License Plate</th>
                                        <th>Location</th>
                                        <th>Available</th>
                                        <th>Price/Day</th>
                                        <th>Deposit</th>
                                        <th>Terms</th>
                                        <th>Images</th>
                                          {/* Conditionally render specific detail headers */}
                                        {vehicleTypeFilter === 'car' && (
                                            <>
                                                <th>Seats</th>
                                                <th>Body Type</th>
                                                <th>Transmission</th>
                                                <th>Fuel Type</th>
                                            </>
                                        )}
                                        {vehicleTypeFilter === 'motorbike' && (
                                            <>
                                                <th>Engine Capacity</th>
                                                <th>Has Gear</th>
                                            </>
                                        )}
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.filter(vehicle => 
                                        vehicleTypeFilter === 'car' ? vehicle.type === 'car' : 
                                        vehicleTypeFilter === 'motorbike' ? vehicle.type === 'motorbike' : 
                                          true // Show all if no specific filter is applied (though 'all' button is removed)
                                    ).map((vehicle) => (
                                        <tr key={vehicle._id}>
                                            <td>{vehicle.brand}</td>
                                            <td>{vehicle.model}</td>
                                            <td>{vehicle.type}</td>
                                            <td>{vehicle.license_plate}</td>
                                            <td>{vehicle.location}</td>
                                            <td>{vehicle.is_available ? 'Yes' : 'No'}</td>
                                            <td>{vehicle.price_per_day ? vehicle.price_per_day.toLocaleString('en-US') : 'N/A'}</td>
                                            <td>{vehicle.deposit_required ? vehicle.deposit_required.toLocaleString('en-US') : 'N/A'}</td>
                                            <td>{vehicle.terms}</td>
                                            <td>
                                                {vehicle.images && vehicle.images.length > 0 ? (
                                                    vehicle.images.map(image => (
                                                        <img 
                                                            key={image._id} 
                                                            src={image.image_url} 
                                                            alt="Vehicle Image" 
                                                            style={{ width: '50px', height: 'auto', marginRight: '5px' }} 
                                                        />
                                                    ))
                                                ) : (
                                                    'No Images'
                                                )}
                                            </td>
                                              {/* Conditionally render specific detail cells */}
                                            {vehicle.type === 'car' && vehicle.carDetails && (
                                                <>
                                                    <td>{vehicle.carDetails.seats}</td>
                                                    <td>{vehicle.carDetails.body_type}</td>
                                                    <td>{vehicle.carDetails.transmission}</td>
                                                    <td>{vehicle.carDetails.fuel_type}</td>
                                                </>
                                            )}
                                            {vehicle.type === 'motorbike' && vehicle.motorbikeDetails && (
                                                <>
                                                    <td>{vehicle.motorbikeDetails.engine_capacity}</td>
                                                    <td>{vehicle.motorbikeDetails.has_gear ? 'Yes' : 'No'}</td>
                                                </>
                                            )}
                                            <td>
                                                <button className="edit-button" onClick={() => handleEdit(vehicle._id)}>Edit</button>
                                                <button className="delete-button" onClick={() => handleDelete(vehicle._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            ) : (
                                // Display a message if no specific filter is selected or no vehicles match the filter
                                vehicleTypeFilter === 'all' ? (
                                    <p>Select a vehicle type to view the list.</p>
                                ) : (
                                    <p>No {vehicleTypeFilter} found.</p>
                                )
                            )
                        )}
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
            case 'editVehicle':
                 // Render edit form, need to create this component
                 return (
                    <div>
                        <h2>Edit Vehicle</h2>
                        {message && <p className={`message ${message.type}`}>{message.text}</p>}
                        {loading && <p>Loading vehicle details...</p>}
                        {fetchError && <p className="message error">{fetchError}</p>}
                        {!loading && !fetchError && editingVehicle && (
                            // Render the appropriate edit form based on vehicle type
                            editingVehicle.type === 'car' ? (
                                <EditCarForm vehicle={editingVehicle} onCancel={() => setCurrentView('list')} onSubmit={handleUpdateSubmit} />
                            ) : (
                                <EditMotorbikeForm vehicle={editingVehicle} onCancel={() => setCurrentView('list')} onSubmit={handleUpdateSubmit} />
                            )
                        )}
                        {/* Add Cancel button if not part of the edit form */}
                        {/* Cancel button is now part of the form components */}
                        {/* {!loading && !fetchError && <button onClick={() => setCurrentView('list')}>Cancel</button>} */}
                    </div>
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