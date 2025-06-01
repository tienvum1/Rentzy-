import React, { useState, useEffect, useRef } from 'react';
import './AddCarForm.css';

const AddCarForm = ({ onCancel, onSubmit }) => {
<<<<<<< HEAD
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

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [errors, setErrors] = useState({});
=======
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        license_plate: '',
        location: '',
        is_available: true, // Default to true
        price_per_day: 0, // Store as number
        deposit_required: 0, // Store as number
        terms: '',
        seats: '',
        body_type: '',
        transmission: '',
        fuel_type: '',
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
>>>>>>> 61a2614aae4347fc466ff87e4478813dfec83ba4

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

<<<<<<< HEAD
  // Tạo preview cho các ảnh thêm
  useEffect(() => {
    // Giải phóng URL của ảnh cũ để tránh rò rỉ bộ nhớ
    additionalImagesPreviews.forEach((url) => URL.revokeObjectURL(url));
=======
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
>>>>>>> 61a2614aae4347fc466ff87e4478813dfec83ba4

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
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = new FormData();

    dataToSubmit.append('brand', formData.brand.trim());
    dataToSubmit.append('model', formData.model.trim());
    dataToSubmit.append('license_plate', formData.license_plate.trim());
    dataToSubmit.append('location', JSON.stringify(formData.location));
    dataToSubmit.append('price_per_day', formData.price_per_day);
    dataToSubmit.append('deposit_required', formData.deposit_required);
    dataToSubmit.append('seats', formData.seats);
    dataToSubmit.append('body_type', formData.body_type);
    dataToSubmit.append('transmission', formData.transmission);
    dataToSubmit.append('fuel_type', formData.fuel_type);
    dataToSubmit.append('type', formData.type);
    dataToSubmit.append('features', formData.features);
    dataToSubmit.append('rentalPolicy', formData.rentalPolicy);
    if (formData.fuelConsumption) {
      dataToSubmit.append('fuelConsumption', formData.fuelConsumption);
    }

    if (formData.main_image) {
      dataToSubmit.append('main_image', formData.main_image);
    }

    // Append selected features
    formData.features.forEach(feature => {
      dataToSubmit.append('features', feature);
    });

    // Append rental policy
    if (formData.rentalPolicy.trim()) {
      dataToSubmit.append('rentalPolicy', formData.rentalPolicy.trim());
    } else {
      dataToSubmit.append('rentalPolicy', '');
    }

    // Kiểm tra trước khi forEach tránh lỗi
    if (
      formData.additional_images &&
      Array.isArray(formData.additional_images) &&
      formData.additional_images.length > 0
    ) {
      formData.additional_images.forEach((file) => {
        dataToSubmit.append('additional_images', file);
      });
    }

    onSubmit(dataToSubmit);
  };

  return (
    <div className="add-vehicle-form">
      <h2>Thêm Xe Mới</h2>
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
          <button type="submit" className="btn-submit">
            Đăng xe cho thuê
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;
