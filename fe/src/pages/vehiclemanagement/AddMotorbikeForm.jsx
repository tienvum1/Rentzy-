import React, { useState, useEffect } from 'react';
import './VehicleForm.css'; // Import the shared CSS file
import axios from 'axios'; // Import axios

const AddMotorbikeForm = ({ onCancel, onSuccess }) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999'; // Define backendUrl
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        license_plate: '',
        location: '',
        is_available: true, // Default to true
        price_per_day: '', // Store as string initially from input
        deposit_required: '', // Store as string initially from input
        terms: '',
        engine_capacity: '',
        has_gear: true, // Default to true
        main_image: null, // Changed from images to main_image based on backend controller
        additional_images: [], // Changed from images to additional_images for multiple images
        type: 'motorbike', // Added type
        features: [], // Added features
        rentalPolicy: '', // Added rentalPolicy
    });

    const [loading, setLoading] = useState(false); // Add loading state
    const [message, setMessage] = useState(null); // Add message state (success/error)
    const [errors, setErrors] = useState({}); // Add errors state

    const [mainImagePreview, setMainImagePreview] = useState(null); // State to store main image preview
    const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]); // State to store additional image previews

    // State for formatted number inputs
    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedDeposit, setFormattedDeposit] = useState('');

    // Helper function to format number with commas
    const formatNumber = (num) => {
        if (num === null || num === undefined || num === '') return ''; // Handle empty string
        // Ensure num is a number before formatting
        const number = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
        if (isNaN(number)) return '';

        return number.toLocaleString('en-US'); // Use locale to handle comma separation
    };

    // Helper function to parse formatted number string to raw number
    const parseNumber = (str) => {
        if (!str) return ''; // Return empty string for empty input
        const cleanedString = str.replace(/,/g, ''); // Remove commas
        // Check if the cleaned string is a valid number before parsing
        if (!/^-?\d*\.?\d*$/.test(cleanedString)) return ''; // Return empty string for invalid input
        return cleanedString; // Return as string to maintain precision until parsed for API
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === 'main_image') {
            const file = files[0] || null;
            setFormData(prev => ({ ...prev, main_image: file }));

            if (file) {
                const previewUrl = URL.createObjectURL(file);
                setMainImagePreview(previewUrl);
            } else {
                setMainImagePreview(null);
            }
        } else if (name === 'additional_images') {
             const newFiles = Array.from(files);
            setFormData(prev => ({ ...prev, additional_images: [...prev.additional_images, ...newFiles] }));

        } else if (name === 'price_per_day' || name === 'deposit_required') {
            const rawValue = parseNumber(value);
            setFormData(prev => ({ ...prev, [name]: rawValue }));
            // Update formatted state separately
            if (name === 'price_per_day') setFormattedPrice(formatNumber(rawValue));
            if (name === 'deposit_required') setFormattedDeposit(formatNumber(rawValue));

        } else if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Function to handle feature toggle
    const handleFeatureToggle = (feature) => {
        setFormData((prev) => {
            const currentFeatures = prev.features || []; // Ensure it's an array
            if (currentFeatures.includes(feature)) {
                // If already selected, remove it
                return {
                    ...prev,
                    features: currentFeatures.filter((f) => f !== feature),
                };
            } else {
                // If not selected, add it
                return {
                    ...prev,
                    features: [...currentFeatures, feature].sort(), // Add and sort for consistency
                };
            }
        });
    };

    // Effect to create previews for additional images
    useEffect(() => {
        // Revoke old URLs to avoid memory leaks
        additionalImagesPreviews.forEach(url => URL.revokeObjectURL(url));

        const newPreviews = formData.additional_images.map(file => URL.createObjectURL(file));
        setAdditionalImagesPreviews(newPreviews);

        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [formData.additional_images]);

     // Effect to revoke main image preview URL when component unmounts or image changes
    useEffect(() => {
        return () => {
            if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
        };
    }, [mainImagePreview]);

    // Function to remove an additional image
    const handleRemoveAdditionalImage = (index) => {
        setFormData(prev => {
            const updated = [...prev.additional_images];
            updated.splice(index, 1);
            return { ...prev, additional_images: updated };
        });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.brand.trim()) newErrors.brand = 'Thương hiệu là bắt buộc';
        if (!formData.model.trim()) newErrors.model = 'Dòng xe là bắt buộc';
        if (!formData.license_plate.trim()) newErrors.license_plate = 'Biển số xe là bắt buộc';
        if (!formData.location.trim()) newErrors.location = 'Địa điểm là bắt buộc';

        const price = parseFloat(formData.price_per_day);
        if (isNaN(price) || price <= 0) newErrors.price_per_day = 'Giá mỗi ngày phải lớn hơn 0';

        const deposit = parseFloat(formData.deposit_required);
        if (isNaN(deposit) || deposit < 0) newErrors.deposit_required = 'Tiền đặt cọc không thể âm';

        const engineCapacity = parseFloat(formData.engine_capacity);
         if (isNaN(engineCapacity) || engineCapacity <= 0) newErrors.engine_capacity = 'Dung tích xi lanh phải lớn hơn 0';

        if (!formData.main_image) newErrors.main_image = 'Ảnh chính là bắt buộc';

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true); // Start loading
        setMessage(null); // Clear previous messages
        setErrors({}); // Clear previous errors

        const dataToSubmit = new FormData();

         // Append fields to FormData
        dataToSubmit.append('brand', formData.brand.trim());
        dataToSubmit.append('model', formData.model.trim());
        dataToSubmit.append('license_plate', formData.license_plate.trim());
         // Assuming location is a string for motorbike form for now
        dataToSubmit.append('location', formData.location.trim());
        dataToSubmit.append('is_available', formData.is_available);
        dataToSubmit.append('price_per_day', parseFloat(formData.price_per_day)); // Ensure number type for API
        dataToSubmit.append('deposit_required', parseFloat(formData.deposit_required)); // Ensure number type for API
        dataToSubmit.append('terms', formData.terms.trim());
        dataToSubmit.append('type', formData.type);

        // Append motorbike specific fields
        dataToSubmit.append('engine_capacity', parseFloat(formData.engine_capacity)); // Ensure number type for API
        dataToSubmit.append('has_gear', formData.has_gear);

         // Append optional fields if they exist
        if (formData.fuelConsumption) {
            dataToSubmit.append('fuelConsumption', formData.fuelConsumption);
        }

        // Append main image
        if (formData.main_image) {
            dataToSubmit.append('main_image', formData.main_image); // Ensure field name matches backend
        } else {
             // Handle case where main image is missing (though validation should catch this)
             setErrors(prev => ({...prev, main_image: 'Ảnh chính là bắt buộc'}));
             setLoading(false);
             return;
        }

         // Append selected features individually
        if (Array.isArray(formData.features)) {
            formData.features.forEach(feature => {
              dataToSubmit.append('features', feature); // Ensure field name matches backend
            });
        }

        // Append rental policy
        if (formData.rentalPolicy.trim()) {
          dataToSubmit.append('rentalPolicy', formData.rentalPolicy.trim()); // Ensure field name matches backend
        } else {
          dataToSubmit.append('rentalPolicy', ''); // Ensure field name matches backend
        }

        // Append additional images individually
        if (Array.isArray(formData.additional_images) && formData.additional_images.length > 0) {
            formData.additional_images.forEach((file) => {
                dataToSubmit.append('additional_images', file); // Ensure field name matches backend
            });
        }

        try {
            const apiUrl = `${backendUrl}/api/vehicles/add`; // Assuming this is the add vehicle endpoint

            const response = await axios.post(apiUrl, dataToSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            if (response.status === 201) {
                console.log('Xe đã được thêm thành công!', response.data);
                 setMessage({ type: 'success', text: response.data.message || 'Xe máy đã được thêm thành công!' });
                 // Call onSuccess to notify parent and trigger list refresh
                if (onSuccess) onSuccess();
                // Optionally, clear the form or close it after a delay
                 setTimeout(() => {
                     onCancel(); // Assuming onCancel closes the form
                 }, 2000); // Close form after 2 seconds

            } else {
                // Handle other successful but unexpected statuses
                console.warn('Unexpected response status:', response.status, response.data);
                 setMessage({ type: 'warning', text: response.data.message || 'Thêm xe máy thành công nhưng có cảnh báo.' });
                 if (onSuccess) onSuccess();
                 setTimeout(() => {
                     onCancel(); // Assuming onCancel closes the form
                 }, 2000); // Close form after 2 seconds
            }

        } catch (error) {
            console.error('Lỗi khi thêm xe máy:', error.response?.data || error.message);
             setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi thêm xe máy.' });
             // Do not call onCancel or onSuccess on error immediately
            setLoading(false); // Stop loading on error
        } finally {
            // Loading state set to false in catch block on error.
            // For success, it stays true until the timeout.
        }
    };

    // Effect to hide messages after a delay
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 3000); // Hide after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [message]); // Rerun effect when message changes

    // List of features (Assuming some common features with cars or a different set)
    const availableFeatures = [
        'Gương chiếu hậu',
        'Đèn LED',
        'Phanh ABS',
        'Khóa chống trộm',
        'Cốp rộng',
        'Sạc USB',
        'Kết nối Bluetooth',
        'Hỗ trợ định vị GPS',
        // Add more motorbike specific features here
    ];

    // Helper function to open file dialog for additional images
    const additionalImagesInputRef = React.useRef(null); // Need a ref for the input

    const handleAddMoreAdditionalImages = () => {
        if (additionalImagesInputRef.current) {
            additionalImagesInputRef.current.click();
        }
    };

    return (
        <div className="add-vehicle-form">
            <h2>Add New Motorbike</h2>
             {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
             {loading && <p>Đang xử lý...</p>}
            <form onSubmit={handleSubmit} noValidate> {/* Added noValidate */}
                 {/* Vehicle Common Fields */}
                <div className="form-group">
                    <label>Brand:</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} required />
                     {errors.brand && <span className="error">{errors.brand}</span>}
                </div>
                <div className="form-group">
                    <label>Model:</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required />
                     {errors.model && <span className="error">{errors.model}</span>}
                </div>
                <div className="form-group">
                    <label>License Plate:</label>
                    <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} required />
                     {errors.license_plate && <span className="error">{errors.license_plate}</span>}
                </div>
                 <div className="form-group">
                    <label>Location:</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                     {errors.location && <span className="error">{errors.location}</span>}
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
                     {errors.price_per_day && <span className="error">{errors.price_per_day}</span>}
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
                     {errors.deposit_required && <span className="error">{errors.deposit_required}</span>}
                </div>
                 <div className="form-group">
                    <label htmlFor="rentalPolicy">Rental Policy (optional):</label> {/* Added rental policy */}
                    <textarea
                         id="rentalPolicy"
                         name="rentalPolicy"
                         value={formData.rentalPolicy}
                         onChange={handleChange}
                         rows="4"
                         placeholder="Enter any special rental terms..."
                    >
                    </textarea>
                </div>
                 <div className="form-group">
                    <label>Available:</label>
                    <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
                </div>

                {/* Motorbike Specific Fields */}
                <div className="form-group">
                    <label>Engine Capacity (cc):</label>
                    <input type="number" name="engine_capacity" value={formData.engine_capacity} onChange={handleChange} required />
                     {errors.engine_capacity && <span className="error">{errors.engine_capacity}</span>}
                </div>
                 <div className="form-group">
                    <label>Has Gear:</label>
                    <input type="checkbox" name="has_gear" checked={formData.has_gear} onChange={handleChange} />
                </div>

                {/* --- Features Section --- */} {/* Added features section */}
                <div className="form-group">
                    <label>Features:</label>
                    <div className="features-grid">
                        {availableFeatures.map((feature) => (
                            <button
                                key={feature}
                                type="button"
                                className={`feature-button ${formData.features.includes(feature) ? 'selected' : ''}`}
                                onClick={() => handleFeatureToggle(feature)}
                            >
                                {feature}
                            </button>
                        ))}
                    </div>
                </div>
                {/* --- End Features Section --- */}

                {/* Image Upload */}
                 <div className="form-group"> {/* Changed from images to main_image and additional_images */}
                    <label>Main Image:</label>
                    <input type="file" name="main_image" onChange={handleChange} accept="image/*" required />
                     {errors.main_image && <span className="error">{errors.main_image}</span>}
                     {mainImagePreview && (
                         <img
                             src={mainImagePreview}
                             alt="Main Image Preview"
                             className="image-preview"
                         />
                     )}
                </div>

                 <div className="form-group">
                    <label>Additional Images:</label>
                     <button
                         type="button"
                         onClick={handleAddMoreAdditionalImages}
                         className="btn-add-images"
                     >
                         Add More Images
                     </button>
                    <input
                         type="file"
                         multiple
                         name="additional_images"
                         accept="image/*"
                         onChange={handleChange}
                         ref={additionalImagesInputRef} // Attach ref
                         style={{ display: 'none' }} // Hide the actual input
                    />
                     <div className="additional-images-preview"> {/* Display additional image previews */}
                        {additionalImagesPreviews.map((url, idx) => (
                            <div key={idx} className="image-wrapper">
                                <img src={url} alt={`Additional Image ${idx}`} />
                                 <button
                                     type="button"
                                     className="btn-remove-image"
                                     onClick={() => handleRemoveAdditionalImage(idx)}
                                 >
                                     X
                                 </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-actions"> {/* Added form-actions div */}
                    <button type="submit" disabled={loading}> {/* Disable button when loading */}
                        {loading ? 'Adding...' : 'Submit'} {/* Change button text when loading */}
                    </button>
                    <button type="button" onClick={onCancel} disabled={loading}> {/* Disable cancel when loading */}
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMotorbikeForm; 