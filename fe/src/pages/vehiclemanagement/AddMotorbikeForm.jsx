import React, { useState } from 'react';
import './VehicleForm.css'; // Import the shared CSS file

const AddMotorbikeForm = ({ onCancel, onSubmit }) => {
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        license_plate: '',
        location: '',
        is_available: true, // Default to true
        price_per_day: 0, // Store as number
        deposit_required: 0, // Store as number
        terms: '',
        engine_capacity: '',
        has_gear: true, // Default to true
        images: [], // To store selected image files
    });

    const [imagePreviews, setImagePreviews] = useState([]); // State to store image previews

    // State for formatted number inputs
    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedDeposit, setFormattedDeposit] = useState('');

    // Helper function to format number with commas
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '';
        // Ensure num is a number before formatting
        const number = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
        if (isNaN(number)) return '';

        return number.toLocaleString('en-US'); // Use locale to handle comma separation
    };

    // Helper function to parse formatted number string to raw number
    const parseNumber = (str) => {
        if (!str) return 0;
        const cleanedString = str.replace(/,/g, ''); // Remove commas
        const number = parseFloat(cleanedString);
        return isNaN(number) ? 0 : number;
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
         if (name === 'images') {
            const selectedFiles = Array.from(files);
            setFormData({ ...formData, images: selectedFiles });

            // Generate image previews
            const previews = selectedFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);

        } else {
            setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
         // Clean up object URLs after submission (optional, but good practice)
        // imagePreviews.forEach(url => URL.revokeObjectURL(url));
        // Call the onSubmit function passed from parent, passing the form data
        onSubmit(formData);
    };

     // Clean up object URLs when component unmounts
    React.useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    return (
        <div className="add-vehicle-form">
            <h2>Add New Motorbike</h2>
            <form onSubmit={handleSubmit}>
                 {/* Vehicle Common Fields */}
                <div className="form-group">
                    <label>Brand:</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Model:</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>License Plate:</label>
                    <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label>Location:</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Price per Day:</label>
                     <input 
                        type="text" // Use type text to allow commas
                        name="price_per_day" 
                        value={formattedPrice} 
                        onChange={(e) => {
                             const rawValue = parseNumber(e.target.value);
                             setFormData({ ...formData, price_per_day: rawValue });
                             setFormattedPrice(formatNumber(rawValue));
                        }}
                        required 
                    />
                </div>
                 <div className="form-group">
                    <label>Deposit Required:</label>
                    <input 
                        type="text" // Use type text to allow commas
                        name="deposit_required" 
                        value={formattedDeposit} 
                        onChange={(e) => {
                             const rawValue = parseNumber(e.target.value);
                             setFormData({ ...formData, deposit_required: rawValue });
                             setFormattedDeposit(formatNumber(rawValue));
                        }}
                        required 
                    />
                </div>
                 <div className="form-group">
                    <label>Terms:</label>
                    <textarea name="terms" value={formData.terms} onChange={handleChange}></textarea>
                </div>
                 <div className="form-group">
                    <label>Available:</label>
                    <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
                </div>

                {/* Motorbike Specific Fields */}
                <div className="form-group">
                    <label>Engine Capacity (cc):</label>
                    <input type="number" name="engine_capacity" value={formData.engine_capacity} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label>Has Gear:</label>
                    <input type="checkbox" name="has_gear" checked={formData.has_gear} onChange={handleChange} />
                </div>

                {/* Image Upload */}
                 <div className="form-group">
                    <label>Images:</label>
                    <input type="file" name="images" onChange={handleChange} multiple accept="image/*" />
                     {/* Display selected image names or previews */}
                     {formData.images.length > 0 && (
                        <p>{formData.images.length} file(s) selected.</p>
                     )}
                      {/* Image Previews */}
                     {imagePreviews.length > 0 && (
                         <div className="image-preview-container">
                             {imagePreviews.map((preview, index) => (
                                 <img key={index} src={preview} alt={`Preview ${index}`} className="image-preview" />
                             ))}
                         </div>
                     )}
                </div>

                <button type="submit">Submit</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </form>
        </div>
    );
};

export default AddMotorbikeForm; 