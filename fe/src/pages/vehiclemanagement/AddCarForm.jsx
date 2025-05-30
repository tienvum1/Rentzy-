import React, { useState } from 'react';
import './VehicleForm.css'; // Import the shared CSS file

const AddCarForm = ({ onCancel, onSubmit }) => {
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        license_plate: '',
        location: '',
        is_available: true, // Default to true
        price_per_day: '',
        deposit_required: '',
        terms: '',
        seats: '',
        body_type: '',
        transmission: '',
        fuel_type: '',
        images: [], // To store selected image files
    });
    
     const [imagePreviews, setImagePreviews] = useState([]); // State to store image previews

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
            <h2>Add New Car</h2>
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
                    <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleChange} required step="0.01"/>
                </div>
                 <div className="form-group">
                    <label>Deposit Required:</label>
                    <input type="number" name="deposit_required" value={formData.deposit_required} onChange={handleChange} required step="0.01"/>
                </div>
                 <div className="form-group">
                    <label>Terms:</label>
                    <textarea name="terms" value={formData.terms} onChange={handleChange}></textarea>
                </div>
                 <div className="form-group">
                    <label>Available:</label>
                    <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
                </div>

                {/* Car Specific Fields */}
                <div className="form-group">
                    <label>Seats:</label>
                    <input type="number" name="seats" value={formData.seats} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label>Body Type:</label>
                     {/* You might want a select dropdown here in a real app */}
                    <input type="text" name="body_type" value={formData.body_type} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Transmission:</label>
                     {/* You might want a select dropdown here in a real app */}
                    <input type="text" name="transmission" value={formData.transmission} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Fuel Type:</label>
                     {/* You might want a select dropdown here in a real app */}
                    <input type="text" name="fuel_type" value={formData.fuel_type} onChange={handleChange} />
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

export default AddCarForm; 