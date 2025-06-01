import React, { useState, useEffect, useRef } from 'react';
import './AddCarForm.css';
import axios from 'axios'; // Import axios
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AddCarForm = ({ onSuccess }) => {
  const navigate = useNavigate(); // Use useNavigate hook
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999'; // Define backendUrl
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    license_plate: '',
    location: { address: '', coordinates: [] },
    price_per_day: '',
    deposit_required: '',
    seats: '',
    body_type: '',
    transmission: '',
    fuel_type: '',
    fuelConsumption: '',
    main_image: null,
    additional_images: [],
    type: 'car',
    features: [],
    rentalPolicy: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [errors, setErrors] = useState({});


  const additionalImagesInputRef = useRef(null);

  const bodyTypeOptions = [
    'Sedan',
    'SUV',
    'Hatchback',
    'Coupe',
    'Convertible',
    'Wagon',
    'Van',
    'Pickup',
  ];

  const transmissionOptions = ['Automatic', 'Manual'];
  const fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

  // List of features based on the image
  const availableFeatures = [
    'Bản đồ',
    'Bluetooth',
    'Camera 360',
    'Camera cập lề',
    'Camera hành trình',
    'Camera lùi',
    'Cảm biến lốp',
    'Cảm biến va chạm',
    'Cảnh báo tốc độ',
    'Cửa sổ trời',
    'Định vị GPS',
    'Ghế trẻ em',
    'Khe cắm USB',
    'Lốp dự phòng',
    'Màn hình DVD',
    'Nắp thùng xe bán tải',
    'ETC',
    'Túi khí an toàn',
  ];

  // Xử lý input thay đổi
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'main_image') {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, main_image: file }));

      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setMainImagePreview(previewUrl);
      } else {
        setMainImagePreview(null);
      }
    } else if (name === 'additional_images') {
      const newFiles = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        additional_images: [...prev.additional_images, ...newFiles],
      }));
    } else if (name === 'location_address') {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, address: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Xử lý chọn/bỏ chọn tính năng
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

  // Tạo preview cho các ảnh thêm
  useEffect(() => {
    // Giải phóng URL của ảnh cũ để tránh rò rỉ bộ nhớ
    additionalImagesPreviews.forEach((url) => URL.revokeObjectURL(url));


    const newPreviews = formData.additional_images.map((file) =>
      URL.createObjectURL(file)
    );
    setAdditionalImagesPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.additional_images]);

  // Giải phóng URL preview main image khi component unmount hoặc thay đổi ảnh mới
  useEffect(() => {
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    };
  }, [mainImagePreview]);

  // Xóa ảnh bổ sung
  const handleRemoveAdditionalImage = (index) => {
    setFormData((prev) => {
      const updated = [...prev.additional_images];
      updated.splice(index, 1);
      return { ...prev, additional_images: updated };
    });
  };

  // Mở file dialog thêm ảnh bổ sung
  const handleAddMoreAdditionalImages = () => {
    if (additionalImagesInputRef.current) {
      additionalImagesInputRef.current.click();
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.brand.trim()) newErrors.brand = 'Thương hiệu là bắt buộc';
    if (!formData.model.trim()) newErrors.model = 'Dòng xe là bắt buộc';
    if (!formData.license_plate.trim())
      newErrors.license_plate = 'Biển số xe là bắt buộc';
    if (!formData.location.address.trim())
      newErrors.location = 'Địa điểm là bắt buộc';

    const price = parseFloat(formData.price_per_day);
    if (isNaN(price) || price <= 0)
      newErrors.price_per_day = 'Giá mỗi ngày phải lớn hơn 0';

    const deposit = parseFloat(formData.deposit_required);
    if (isNaN(deposit) || deposit < 0)
      newErrors.deposit_required = 'Tiền đặt cọc không thể âm';

    const seatsNum = parseInt(formData.seats, 10);
    if (isNaN(seatsNum) || seatsNum <= 0)
      newErrors.seats = 'Số chỗ ngồi phải lớn hơn 0';

    if (!formData.body_type) newErrors.body_type = 'Dạng thân xe là bắt buộc';
    if (!formData.transmission) newErrors.transmission = 'Hộp số là bắt buộc';
    if (!formData.fuel_type) newErrors.fuel_type = 'Loại nhiên liệu là bắt buộc';

    if (!formData.main_image) newErrors.main_image = 'Ảnh chính là bắt buộc';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit form
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
    // Assuming location needs to be stringified based on backend controller
    dataToSubmit.append('location', JSON.stringify(formData.location));
    dataToSubmit.append('price_per_day', formData.price_per_day);
    dataToSubmit.append('deposit_required', formData.deposit_required);
    dataToSubmit.append('seats', formData.seats);
    dataToSubmit.append('body_type', formData.body_type);
    dataToSubmit.append('transmission', formData.transmission);
    dataToSubmit.append('fuel_type', formData.fuel_type);
    dataToSubmit.append('type', formData.type);

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
      // Use the backendUrl variable
      const apiUrl = `${backendUrl}/api/vehicles/add`; // Assuming this is the add vehicle endpoint
      const response = await axios.post(apiUrl, dataToSubmit, {
        withCredentials: true,
      });

      if (response.status === 201) {
        console.log('Xe đã được thêm thành công', response.data);
        setMessage({ type: 'success', text: response.data.message || 'Xe đã được thêm thành công!' });
        // Call onSuccess to notify parent and trigger list refresh
        if (onSuccess) onSuccess();
        // Optionally, clear the form or close it after a delay
         setTimeout(() => {
             navigate('/vehiclemanagement'); // Navigate back to list
         }, 2000); // Close form after 2 seconds

      } else {
          // Handle other successful but unexpected statuses if necessary
           console.warn('Unexpected response status:', response.status, response.data);
           setMessage({ type: 'warning', text: response.data.message || 'Thêm xe thành công nhưng có cảnh báo.' });
           if (onSuccess) onSuccess();
            setTimeout(() => {
             navigate('/vehiclemanagement'); // Navigate back to list
         }, 2000); // Close form after 2 seconds
      }

    } catch (error) {
      console.error('Lỗi khi thêm xe:', error.response?.data || error.message);
       setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi thêm xe.' });
       // Do not call onCancel or onSuccess on error immediately, let user see the error message
        setLoading(false); // Stop loading on error
    } finally {
      // Loading state will be set to false in catch block on error.
      // For success, it stays true until the timeout clears the message and calls onCancel
    }
  };

  // Effect to hide messages after a delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
         // If it was a success message, hide it and then potentially close the form
         if (message.type === 'success' || message.type === 'warning') {
             // Form closing is now handled in the try block after a delay
         }
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message]); // Rerun effect when message changes

  return (
    <>
    <SidebarOwner />
    <div className="add-vehicle-form">
      <h2>Thêm Xe Mới</h2>
       {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
       {loading && <p>Đang xử lý...</p>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Thương hiệu:</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
          />
          {errors.brand && <span className="error">{errors.brand}</span>}
        </div>

        <div className="form-group">
          <label>Dòng xe:</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
          />
          {errors.model && <span className="error">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label>Biển số xe:</label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleChange}
          />
          {errors.license_plate && (
            <span className="error">{errors.license_plate}</span>
          )}
        </div>

        <div className="form-group">
          <label>Địa điểm:</label>
          <input
            type="text"
            name="location_address"
            value={formData.location.address}
            onChange={handleChange}
          />
          {errors.location && <span className="error">{errors.location}</span>}
        </div>

        <div className="form-group">
          <label>Giá mỗi ngày (VND):</label>
          <input
            type="number"
            name="price_per_day"
            value={formData.price_per_day}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
          {errors.price_per_day && (
            <span className="error">{errors.price_per_day}</span>
          )}
        </div>

        <div className="form-group">
          <label>Tiền đặt cọc (VND):</label>
          <input
            type="number"
            name="deposit_required"
            value={formData.deposit_required}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
          {errors.deposit_required && (
            <span className="error">{errors.deposit_required}</span>
          )}
        </div>

        <div className="form-group">
          <label>Số chỗ ngồi:</label>
          <input
            type="number"
            name="seats"
            value={formData.seats}
            onChange={handleChange}
            min="1"
          />
          {errors.seats && <span className="error">{errors.seats}</span>}
        </div>

        <div className="form-group">
          <label>Dạng thân xe:</label>
          <select
            name="body_type"
            value={formData.body_type}
            onChange={handleChange}
          >
            <option value="">-- Chọn dạng thân xe --</option>
            {bodyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.body_type && <span className="error">{errors.body_type}</span>}
        </div>

        <div className="form-group">
          <label>Hộp số:</label>
          <select
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
          >
            <option value="">-- Chọn hộp số --</option>
            {transmissionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.transmission && (
            <span className="error">{errors.transmission}</span>
          )}
        </div>

        <div className="form-group">
          <label>Loại nhiên liệu:</label>
          <select
            name="fuel_type"
            value={formData.fuel_type}
            onChange={handleChange}
          >
            <option value="">-- Chọn loại nhiên liệu --</option>
            {fuelTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.fuel_type && <span className="error">{errors.fuel_type}</span>}
        </div>

        {/* Conditionally render Fuel Consumption */}
        {(formData.fuel_type === 'Gasoline' ||
          formData.fuel_type === 'Diesel' ||
          formData.fuel_type === 'Hybrid') && (
          <div className="form-group">
            <label>Tiêu hao nhiên liệu (tùy chọn):</label>
            <input
              type="text"
              name="fuelConsumption"
              value={formData.fuelConsumption}
              onChange={handleChange}
              placeholder="VD: 7.5 L/100km"
            />
          </div>
        )}

        {/* --- Features Section --- */}
        <div className="form-group">
          <label>Tính năng:</label>
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

        <div className="form-group">
          <label htmlFor="rentalPolicy">Điều khoản thuê xe (tùy chọn):</label>
          <textarea
            id="rentalPolicy"
            name="rentalPolicy"
            value={formData.rentalPolicy}
            onChange={handleChange}
            rows="4"
            placeholder="Nhập các điều khoản đặc biệt khi thuê xe này..."
          >
          </textarea>
        </div>

        <div className="form-group">
          <label>Ảnh chính:</label>
          <input
            type="file"
            name="main_image"
            accept="image/*"
            onChange={handleChange}
          />
          {errors.main_image && <span className="error">{errors.main_image}</span>}
          {mainImagePreview && (
            <img
              src={mainImagePreview}
              alt="Ảnh chính Preview"
              className="image-preview"
            />
          )}
        </div>

        <div className="form-group">
          <label>Ảnh phụ:</label>
          <button
            type="button"
            onClick={handleAddMoreAdditionalImages}
            className="btn-add-images"
          >
            Thêm ảnh khác
          </button>
          <input
            type="file"
            multiple
            name="additional_images"
            accept="image/*"
            onChange={handleChange}
            ref={additionalImagesInputRef}
            style={{ display: 'none' }}
          />
          <div className="additional-images-preview">
            {additionalImagesPreviews.map((url, idx) => (
              <div key={idx} className="image-wrapper">
                <img src={url} alt={`Ảnh phụ ${idx}`} />
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

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang thêm...' : 'Đăng xe cho thuê'}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/ownerpage/vehicle-management')}>
            Hủy
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default AddCarForm;
