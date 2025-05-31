import React, { useState, useEffect } from 'react';
import './VehicleForm.css'; // Import the shared CSS file

const EditCarForm = ({ vehicle, onCancel, onSubmit }) => {
    // Initialize state with vehicle data
    const [formData, setFormData] = useState({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        license_plate: vehicle.license_plate || '',
        location: vehicle.location || '',
        is_available: vehicle.is_available || false,
        // Initialize raw price and deposit
        price_per_day_raw: vehicle.price_per_day || 0,
        deposit_required_raw: vehicle.deposit_required || 0,
        terms: vehicle.terms || '',
        // Car specific details
        seats: vehicle.carDetails?.seats || '',
        body_type: vehicle.carDetails?.body_type || '',
        transmission: vehicle.carDetails?.transmission || '',
        fuel_type: vehicle.carDetails?.fuel_type || '',
        // Add state for images if needed for editing (complex, maybe skip for now)
        images: [] // Placeholder
    });

    // State for formatted numbers to display in inputs
    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedDeposit, setFormattedDeposit] = useState('');

    // Effect to update form state when vehicle prop changes
    useEffect(() => {
        if (vehicle) {
            setFormData({
                brand: vehicle.brand || '',
                model: vehicle.model || '',
                license_plate: vehicle.license_plate || '',
                location: vehicle.location || '',
                is_available: vehicle.is_available || false,
                price_per_day_raw: vehicle.price_per_day || 0,
                deposit_required_raw: vehicle.deposit_required || 0,
                terms: vehicle.terms || '',
                seats: vehicle.carDetails?.seats || '',
                body_type: vehicle.carDetails?.body_type || '',
                transmission: vehicle.carDetails?.transmission || '',
                fuel_type: vehicle.carDetails?.fuel_type || '',
                images: [] // Keep as placeholder for now
            });
            // Also update formatted numbers when vehicle data loads
            // Ensure price_per_day and deposit_required are numbers before calling toLocaleString
            setFormattedPrice(typeof vehicle.price_per_day === 'number' ? vehicle.price_per_day.toLocaleString('en-US') : '');
            setFormattedDeposit(typeof vehicle.deposit_required === 'number' ? vehicle.deposit_required.toLocaleString('en-US') : '');
        }
    }, [vehicle]); // Rerun this effect when the vehicle prop changes

    // Effect to format numbers when raw state changes
    useEffect(() => {
        // Ensure price_per_day_raw and deposit_required_raw are numbers before calling toLocaleString
        setFormattedPrice(typeof formData.price_per_day_raw === 'number' ? formData.price_per_day_raw.toLocaleString('en-US') : '');
        setFormattedDeposit(typeof formData.deposit_required_raw === 'number' ? formData.deposit_required_raw.toLocaleString('en-US') : '');
    }, [formData.price_per_day_raw, formData.deposit_required_raw]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'price_per_day' || name === 'deposit_required') {
            // Remove non-digit characters except dot (if using decimals, though likely integers here)
            const rawValue = value.replace(/[^0-9]/g, '');
            const numberValue = parseInt(rawValue, 10) || 0; // Convert to integer

            setFormData(prev => ({
                ...prev,
                [name === 'price_per_day' ? 'price_per_day_raw' : 'deposit_required_raw']: numberValue
            }));

        } else if (name === 'is_available' ) {
             setFormData(prev => ({
                 ...prev,
                 [name]: type === 'checkbox' ? checked : value
             }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Assume a function to handle image changes if image editing is implemented
    // const handleImageChange = (e) => { ... };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Pass the raw number values to the onSubmit handler
        onSubmit(vehicle._id, {
            ...formData,
            price_per_day: formData.price_per_day_raw,
            deposit_required: formData.deposit_required_raw,
            // Remove raw values from submission data
            price_per_day_raw: undefined,
            deposit_required_raw: undefined,
            images: undefined // Or handle images properly if needed
        });
    };

    return (
        <div className="edit-vehicle-form">
            
            <form onSubmit={handleSubmit}>
                {/* Vehicle Common Fields */}
                <div className="form-group">
                    <label>Brand:</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Model:</label>
                    <input type="text" name="model" value={formData.model} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>License Plate:</label>
                    <input type="text" name="license_plate" value={formData.license_plate} onChange={handleInputChange} required />
                </div>
                 <div className="form-group">
                    <label>Location:</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Price per Day:</label>
                    <input type="text" name="price_per_day" value={formattedPrice} onChange={handleInputChange} required />
                </div>
                 <div className="form-group">
                    <label>Deposit Required:</label>
                    <input type="text" name="deposit_required" value={formattedDeposit} onChange={handleInputChange} required />
                </div>
                 <div className="form-group">
                    <label>Terms:</label>
                    <textarea name="terms" value={formData.terms} onChange={handleInputChange}></textarea>
                </div>
                 <div className="form-group">
                    <label>Available:</label>
                    <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleInputChange} />
                </div>

                {/* Car Specific Fields */}
                 <div className="form-group">
                    <label>Seats:</label>
                    <input type="text" name="seats" value={formData.seats} onChange={handleInputChange} required />
                </div>
                 <div className="form-group">
                    <label>Body Type:</label>
                    <input type="text" name="body_type" value={formData.body_type} onChange={handleInputChange} />
                </div>
                 <div className="form-group">
                    <label>Transmission:</label>
                    <input type="text" name="transmission" value={formData.transmission} onChange={handleInputChange} />
                </div>
                 <div className="form-group">
                    <label>Fuel Type:</label>
                    <input type="text" name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} />
                </div>

                {/* Image handling would go here */}

                <button type="submit">Save Changes</button>
                <button style={{backgroundColor: 'red'}} type="button" onClick={onCancel}>Cancel</button>
            </form>
        </div>
    );
};

export default EditCarForm; 