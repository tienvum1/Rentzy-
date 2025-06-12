import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VehicleChangesPage.css';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin';

const VehicleChangesPage = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

    const fetchVehiclesWithPendingChanges = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${backendUrl}/api/vehicles/admin/pending-changes`, {
                withCredentials: true
            });
            setVehicles(response.data.vehicles);
        } catch (err) {
            console.error('Error fetching vehicles with pending changes:', err);
            setError(err.response?.data?.message || 'Failed to fetch vehicles with pending changes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehiclesWithPendingChanges();
    }, []);

    const handleReviewChanges = async (vehicleId, status, rejectionReason = '') => {
        console.log("DEBUG_FRONTEND: Attempting to review changes for Vehicle ID:", vehicleId);
        try {
            const response = await axios.put(
                `${backendUrl}/api/vehicles/admin/review-changes/${vehicleId}`,
                {
                    status,
                    rejectionReason
                },
                {
                    withCredentials: true
                }
            );

            setMessage({
                type: 'success',
                text: response.data.message
            });

            // Refresh the list after successful review
            fetchVehiclesWithPendingChanges();
        } catch (err) {
            console.error('Error reviewing vehicle changes:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to review vehicle changes'
            });
        }
    };

    const renderChanges = (vehicle) => {
        const changes = vehicle.pendingChanges;
        if (!changes) return null;

        console.log("DEBUG_FRONTEND: renderChanges - Vehicle ID (main):", vehicle._id);
        console.log("DEBUG_FRONTEND: renderChanges - pendingChanges object:", changes);

        return (
            <div className="changes-section">
                <h4>Proposed Changes:</h4>
                <div className="changes-grid">
                    {Object.entries(changes).map(([key, value]) => {
                        if (key === 'specificDetails') {
                            return (
                                <div key={key} className="change-item">
                                    <strong>{key}:</strong>
                                    <ul>
                                        {Object.entries(value).map(([detailKey, detailValue]) => (
                                            <li key={detailKey}>
                                                {detailKey}: {detailValue !== undefined && detailValue !== null ? detailValue.toString() : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        } else if (key === 'features') {
                            return (
                                <div key={key} className="change-item">
                                    <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : (value ? value.toString() : '')}
                                </div>
                            );
                        }
                        return (
                            <div key={key} className="change-item">
                                <strong>{key}:</strong> {value !== undefined && value !== null ? value.toString() : ''}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="vehicle-changes-container">
                <SidebarAdmin />
                <div className="vehicle-changes-content">
                    <p>Loading vehicles with pending changes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-changes-container">
            <SidebarAdmin />
            <div className="vehicle-changes-content">
                <h2>Vehicle Change Requests</h2>
                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}

                {vehicles.length === 0 ? (
                    <p>No vehicles with pending changes</p>
                ) : (
                    <div className="vehicles-grid">
                        {vehicles.map(vehicle => (
                            <div key={vehicle._id} className="vehicle-card">
                                <div className="vehicle-image">
                                    {vehicle.primaryImage ? (
                                        <img src={vehicle.primaryImage} alt={`${vehicle.brand} ${vehicle.model}`} />
                                    ) : (
                                        <div className="no-image">No Image</div>
                                    )}
                                </div>
                                <div className="vehicle-info">
                                    <h3>{vehicle.brand} {vehicle.model}</h3>
                                    <p>Type: {vehicle.type}</p>
                                    <p>License Plate: {vehicle.licensePlate}</p>
                                    <p>Owner: {vehicle.owner?.name || 'Unknown'}</p>
                                    {renderChanges(vehicle)}
                                    <div className="review-actions">
                                        <button
                                            className="approve-button"
                                            onClick={() => {
                                                console.log("DEBUG_FRONTEND: Clicked Approve for Vehicle ID:", vehicle._id);
                                                handleReviewChanges(vehicle._id, 'approved');
                                            }}
                                        >
                                            Approve Changes
                                        </button>
                                        <button
                                            className="reject-button"
                                            onClick={() => {
                                                const reason = window.prompt('Please provide a reason for rejection:');
                                                if (reason) {
                                                    console.log("DEBUG_FRONTEND: Clicked Reject for Vehicle ID:", vehicle._id, "Reason:", reason);
                                                    handleReviewChanges(vehicle._id, 'rejected', reason);
                                                }
                                            }}
                                        >
                                            Reject Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleChangesPage; 