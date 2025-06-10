import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditVehicle.css';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';

const EditVehicle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [vehicle, setVehicle] = useState(null);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        licensePlate: '',
        location: '',
        pricePerDay: '',
        deposit: '',
        fuelConsumption: '',
        features: [],
        rentalPolicy: '',
        primaryImage: null,
        gallery: [],
        // Car specific fields
        seatCount: '',
        bodyType: '',
        transmission: '',
        fuelType: '',
        // Motorbike specific fields
        engineCapacity: '',
        hasGear: false,
    });

    // Danh sách các tính năng phổ biến (có thể mở rộng tuỳ ý)
    const FEATURE_OPTIONS = [
        "Bản đồ",
        "Bluetooth",
        "Camera 360",
        "Camera cập lề",
        "Camera hành trình",
        "Camera lùi",
        "Cảm biến lốp",
        "Cảm biến va chạm",
        "Cảnh báo tốc độ",
        "Cửa sổ trời",
        "Định vị GPS",
        "Ghế trẻ em",
        "Khe cắm USB",
        "Lốp dự phòng",
        "Màn hình DVD",
        "Nắp thùng xe bán tải",
        "ETC",
        "Túi khí an toàn"
    ];

    // Fetch vehicle data
    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/vehicles/${id}`, {
                    withCredentials: true
                });
                const vehicleData = response.data.vehicle;
                setVehicle(vehicleData);
                
                // Set form data with vehicle information
                setFormData({
                    brand: vehicleData.brand || '',
                    model: vehicleData.model || '',
                    licensePlate: vehicleData.licensePlate || '',
                    location: vehicleData.location || '',
                    pricePerDay: vehicleData.pricePerDay || '',
                    deposit: vehicleData.deposit || '',
                    fuelConsumption: vehicleData.fuelConsumption || '',
                    features: vehicleData.features || [],
                    rentalPolicy: vehicleData.rentalPolicy || '',
                    primaryImage: null,
                    gallery: vehicleData.gallery || [],
                    // Set type-specific fields based on vehicle type
                    ...(vehicleData.type === 'car' && {
                        seatCount: vehicleData.carDetails?.seatCount || '',
                        bodyType: vehicleData.carDetails?.bodyType || '',
                        transmission: vehicleData.carDetails?.transmission || '',
                        fuelType: vehicleData.carDetails?.fuelType || '',
                    }),
                    ...(vehicleData.type === 'motorbike' && {
                        engineCapacity: vehicleData.motorbikeDetails?.engineCapacity || '',
                        hasGear: vehicleData.motorbikeDetails?.hasGear || false,
                    }),
                });
            } catch (err) {
                console.error('Error fetching vehicle:', err);
                setError('Failed to load vehicle data');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id, backendUrl]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'file') {
            if (name === 'primaryImage') {
                setFormData(prev => ({
                    ...prev,
                    primaryImage: e.target.files[0]
                }));
            } else if (name === 'gallery') {
                const files = Array.from(e.target.files);
                setFormData(prev => ({
                    ...prev,
                    gallery: files
                }));
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFeatureButtonClick = (feature) => {
        setFormData((prev) => {
            const features = prev.features.includes(feature)
                ? prev.features.filter((f) => f !== feature)
                : [...prev.features, feature];
            return { ...prev, features };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const formDataToSend = new FormData();
            
            // Append all form fields to FormData
            Object.keys(formData).forEach(key => {
                if (key === 'features') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'primaryImage' && formData.primaryImage) {
                    formDataToSend.append('main_image', formData.primaryImage);
                } else if (key === 'gallery' && formData.gallery.length > 0) {
                    formData.gallery.forEach(file => {
                        formDataToSend.append('additional_images', file);
                    });
                } else if (key !== 'primaryImage' && key !== 'gallery') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add type-specific fields
            if (vehicle.type === 'car') {
                formDataToSend.append('seatCount', formData.seatCount);
                formDataToSend.append('bodyType', formData.bodyType);
                formDataToSend.append('transmission', formData.transmission);
                formDataToSend.append('fuelType', formData.fuelType);
            } else if (vehicle.type === 'motorbike') {
                formDataToSend.append('engineCapacity', formData.engineCapacity);
                formDataToSend.append('hasGear', formData.hasGear);
            }

            const response = await axios.put(
                `${backendUrl}/api/vehicles/${id}/request-update`,
                formDataToSend,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setMessage({
                type: 'success',
                text: 'Vehicle update request submitted successfully. Waiting for admin approval.'
            });

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/ownerpage/vehicle-management');
            }, 3000);

        } catch (err) {
            console.error('Error updating vehicle:', err);
            setError(err.response?.data?.message || 'Failed to update vehicle');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !vehicle) {
        return <div>Loading...</div>;
    }

    if (error && !vehicle) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="edit-vehicle-container">
            <SidebarOwner />
            <div className="edit-vehicle-content">
                <h2>Edit Vehicle</h2>
                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="edit-vehicle-form">
                    {/* Common Fields */}
                    <div className="form-group">
                        <label>Brand:</label>
                        <input
                            type="text"
                            name="brand"
                            value={formData.brand}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Model:</label>
                        <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>License Plate:</label>
                        <input
                            type="text"
                            name="licensePlate"
                            value={formData.licensePlate}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Location:</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Price per Day (VND):</label>
                        <input
                            type="number"
                            name="pricePerDay"
                            value={formData.pricePerDay}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Deposit (VND):</label>
                        <input
                            type="number"
                            name="deposit"
                            value={formData.deposit}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Fuel Consumption (l/100km):</label>
                        <input
                            type="number"
                            name="fuelConsumption"
                            value={formData.fuelConsumption}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tính năng:</label>
                        <div className="features-button-group">
                            {FEATURE_OPTIONS.map((feature) => (
                                <button
                                    type="button"
                                    key={feature}
                                    className={`feature-btn${formData.features.includes(feature) ? " selected" : ""}`}
                                    onClick={() => handleFeatureButtonClick(feature)}
                                >
                                    {feature}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Rental Policy:</label>
                        <textarea
                            name="rentalPolicy"
                            value={formData.rentalPolicy}
                            onChange={handleInputChange}
                            rows="4"
                        />
                    </div>

                    {/* Image Fields */}
                    <div className="form-group">
                        <label>Primary Image:</label>
                        <input
                            type="file"
                            name="primaryImage"
                            onChange={handleInputChange}
                            accept="image/*"
                        />
                        {vehicle?.primaryImage && (
                            <img
                                src={vehicle.primaryImage}
                                alt="Current main image"
                                className="current-image"
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Gallery Images:</label>
                        <input
                            type="file"
                            name="gallery"
                            onChange={handleInputChange}
                            accept="image/*"
                            multiple
                        />
                        {vehicle?.gallery && vehicle.gallery.length > 0 && (
                            <div className="gallery-preview">
                                {vehicle.gallery.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Gallery image ${index + 1}`}
                                        className="gallery-image"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Type-specific Fields */}
                    {vehicle.type === 'car' && (
                        <>
                            <div className="form-group">
                                <label>Number of Seats:</label>
                                <input
                                    type="number"
                                    name="seatCount"
                                    value={formData.seatCount}
                                    onChange={handleInputChange}
                                    required
                                    min="2"
                                />
                            </div>

                            <div className="form-group">
                                <label>Body Type:</label>
                                <select
                                    name="bodyType"
                                    value={formData.bodyType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Body Type</option>
                                    <option value="sedan">Sedan</option>
                                    <option value="suv">SUV</option>
                                    <option value="hatchback">Hatchback</option>
                                    <option value="pickup">Pickup</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Transmission:</label>
                                <select
                                    name="transmission"
                                    value={formData.transmission}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Transmission</option>
                                    <option value="manual">Manual</option>
                                    <option value="automatic">Automatic</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Fuel Type:</label>
                                <select
                                    name="fuelType"
                                    value={formData.fuelType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Fuel Type</option>
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="electric">Electric</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </>
                    )}

                    {vehicle.type === 'motorbike' && (
                        <>
                            <div className="form-group">
                                <label>Engine Capacity (cc):</label>
                                <input
                                    type="number"
                                    name="engineCapacity"
                                    value={formData.engineCapacity}
                                    onChange={handleInputChange}
                                    required
                                    min="50"
                                />
                            </div>

                            <div className="form-group">
                                <label>Has Gear:</label>
                                <input
                                    type="checkbox"
                                    name="hasGear"
                                    checked={formData.hasGear}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Update Request'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate('/ownerpage/vehicle-management')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVehicle; 