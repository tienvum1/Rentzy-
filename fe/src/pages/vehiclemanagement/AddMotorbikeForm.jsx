import React, { useState, useEffect, useRef } from 'react';
import './AddMotorbikeForm.css'; // Updated to use its own CSS file
import axios from 'axios';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';
import { useNavigate } from 'react-router-dom';

const AddMotorbikeForm = () => {
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    license_plate: '',
    location: '',
    price_per_day: '',
    deposit_required: '',
    engineCapacity: '', // Motorbike specific
    hasGear: '', // Motorbike specific (boolean as string 'true'/'false')
    fuelConsumption: '',
    main_image: null,
    additional_images: [],
    type: 'motorbike', // Set vehicle type to motorbike
    features: [],
    rentalPolicy: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [errors, setErrors] = useState({});

  const additionalImagesInputRef = useRef(null);

  const availableFeatures = [
    'Gương chiếu hậu',
    'Đèn LED',
    'Khóa chống trộm',
    'Cốp rộng',
    'Sạc USB',
    'Hỗ trợ định vị GPS',
    'Smart key',
    'Cổng sạc USB',
    'Đèn pha tự động',
    'Báo động chống trộm',
    'Khởi động bằng cần đạp',
    'Phanh đĩa trước',
    'Phanh đĩa sau', 
    'Chế độ lái tiết kiệm (Eco)',
    'Chế độ lái thể thao (Sport)',
    'Công tắc ngắt động cơ khẩn cấp',
    'Chế độ lùi (cho xe điện)',
    'Chìa khóa cơ',
    'Giá đèo hàng phía sau',
    'Giá để chân sau sau thoải mái',
  ];

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

  const handleFeatureToggle = (feature) => {
    setFormData((prev) => {
      const currentFeatures = prev.features || [];
      if (currentFeatures.includes(feature)) {
        return {
          ...prev,
          features: currentFeatures.filter((f) => f !== feature),
        };
      } else {
        return {
          ...prev,
          features: [...currentFeatures, feature].sort(),
        };
      }
    });
  };

  useEffect(() => {
    additionalImagesPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = formData.additional_images.map((file) =>
      URL.createObjectURL(file)
    );
    setAdditionalImagesPreviews(newPreviews);
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.additional_images]);

  useEffect(() => {
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    };
  }, [mainImagePreview]);

  const handleRemoveAdditionalImage = (index) => {
    setFormData((prev) => {
      const updated = [...prev.additional_images];
      updated.splice(index, 1);
      return { ...prev, additional_images: updated };
    });
  };

  const handleAddMoreAdditionalImages = () => {
    if (additionalImagesInputRef.current) {
      additionalImagesInputRef.current.click();
    }
  };

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

    // Motorbike specific validation
    const engineCap = parseFloat(formData.engineCapacity);
    if (isNaN(engineCap) || engineCap <= 0)
      newErrors.engineCapacity = 'Dung tích động cơ phải lớn hơn 0';
    if (formData.hasGear === '')
      newErrors.hasGear = 'Hộp số là bắt buộc';

    if (!formData.main_image) newErrors.main_image = 'Ảnh chính là bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);
    setErrors({});

    const dataToSubmit = new FormData();

    dataToSubmit.append('brand', formData.brand.trim());
    dataToSubmit.append('model', formData.model.trim());
    dataToSubmit.append('license_plate', formData.license_plate.trim());
    dataToSubmit.append('location', JSON.stringify(formData.location));
    dataToSubmit.append('price_per_day', formData.price_per_day);
    dataToSubmit.append('deposit_required', formData.deposit_required);
    dataToSubmit.append('type', formData.type); // 'motorbike'

    // Motorbike specific fields
    dataToSubmit.append('engineCapacity', formData.engineCapacity);
    dataToSubmit.append('hasGear', formData.hasGear);

    if (formData.fuelConsumption) {
      dataToSubmit.append('fuelConsumption', formData.fuelConsumption);
    }

    if (formData.main_image) {
      dataToSubmit.append('main_image', formData.main_image);
    } else {
         setErrors(prev => ({...prev, main_image: 'Ảnh chính là bắt buộc'}));
         setLoading(false);
         return;
    }

    if (Array.isArray(formData.features)) {
        formData.features.forEach(feature => {
          dataToSubmit.append('features', feature);
        });
    }

    if (formData.rentalPolicy.trim()) {
      dataToSubmit.append('rentalPolicy', formData.rentalPolicy.trim());
    }

    // Append additional images
    formData.additional_images.forEach((file) => {
      dataToSubmit.append('additional_images', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${backendUrl}/api/vehicles`,
        dataToSubmit,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Xe máy đã được thêm thành công và đang chờ admin duyệt!');
      setLoading(false);
      // Optional: Clear form or redirect
      setFormData({
        brand: '', model: '', license_plate: '', location: '', price_per_day: '',
        deposit_required: '', engineCapacity: '', hasGear: '', fuelConsumption: '',
        main_image: null, additional_images: [], type: 'motorbike', features: [], rentalPolicy: '',
      });
      setMainImagePreview(null);
      setAdditionalImagesPreviews([]);
      navigate('/ownerpage/vehicle-management'); // Redirect to vehicle management
    } catch (error) {
      setLoading(false);
      console.error('Lỗi khi thêm xe máy:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi thêm xe máy.';
      const field = error.response?.data?.field;
      if (field) {
        setErrors(prev => ({...prev, [field]: errorMsg}));
      } else {
        setMessage(errorMsg);
      }
    }
  };

  return (
    <div className="main-content">
      <SidebarOwner />
      <div className="content">
        {message && (
          <div className={`form-message ${message.includes('thành công') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <form className="add-vehicle-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <h2>Thêm xe mới</h2>
            <label htmlFor="brand">Thương hiệu</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className={errors.brand ? 'input-error' : ''}
            />
            {errors.brand && <span className="error-text">{errors.brand}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="model">Dòng xe</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className={errors.model ? 'input-error' : ''}
            />
            {errors.model && <span className="error-text">{errors.model}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="license_plate">Biển số xe</label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              className={errors.license_plate ? 'input-error' : ''}
            />
            {errors.license_plate && (
              <span className="error-text">{errors.license_plate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">Địa điểm (Địa chỉ cụ thể)</label>
            <input
              type="text"
              id="location_address"
              name="location_address"
              value={formData.location.address || ''}
              onChange={handleChange}
              className={errors.location ? 'input-error' : ''}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price_per_day">Giá mỗi ngày (VNĐ)</label>
            <input
              type="number"
              id="price_per_day"
              name="price_per_day"
              value={formData.price_per_day}
              onChange={handleChange}
              className={errors.price_per_day ? 'input-error' : ''}
            />
            {errors.price_per_day && (
              <span className="error-text">{errors.price_per_day}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="deposit_required">Tiền đặt cọc (VNĐ)</label>
            <input
              type="number"
              id="deposit_required"
              name="deposit_required"
              value={formData.deposit_required}
              onChange={handleChange}
              className={errors.deposit_required ? 'input-error' : ''}
            />
            {errors.deposit_required && (
              <span className="error-text">{errors.deposit_required}</span>
            )}
          </div>

          {/* Motorbike specific fields */}
          <div className="form-group">
            
            <label htmlFor="engineCapacity">Dung tích động cơ (cc)</label>
            <input
              type="number"
              id="engineCapacity"
              name="engineCapacity"
              value={formData.engineCapacity}
              onChange={handleChange}
              className={errors.engineCapacity ? 'input-error' : ''}
            />
            {errors.engineCapacity && (
              <span className="error-text">{errors.engineCapacity}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="hasGear">Loại hộp số</label>
            <select
              id="hasGear"
              name="hasGear"
              value={formData.hasGear}
              onChange={handleChange}
              className={errors.hasGear ? 'input-error' : ''}
            >
              <option value="">Chọn loại hộp số</option>
              <option value="true">Có số</option>
              <option value="false">Không số (Tay ga)</option>
            </select>
            {errors.hasGear && <span className="error-text">{errors.hasGear}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fuelConsumption">Mức tiêu thụ nhiên liệu (lít/100km, tùy chọn)</label>
            <input
              type="text"
              id="fuelConsumption"
              name="fuelConsumption"
              value={formData.fuelConsumption}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="rentalPolicy">Chính sách thuê (tùy chọn)</label>
            <textarea
              id="rentalPolicy"
              name="rentalPolicy"
              value={formData.rentalPolicy}
              onChange={handleChange}
              rows="5"
            ></textarea>
          </div>

          

          <div className="form-group">
            <h3>Tính năng</h3>
            <div className="features-grid">
              {availableFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  className={`feature-button ${
                    formData.features.includes(feature) ? 'selected' : ''
                  }`}
                  onClick={() => handleFeatureToggle(feature)}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group image-preview-container">
            <h3>Ảnh xe máy</h3>
            <label htmlFor="main_image" className="image-upload-label">Ảnh chính</label>
            <input
              type="file"
              id="main_image"
              name="main_image"
              accept="image/*"
              onChange={handleChange}
              className={errors.main_image ? 'input-error' : ''}
            />
            {mainImagePreview && (
              <img src={mainImagePreview} alt="Main Preview" className="image-preview" />
            )}
            {errors.main_image && <span className="error-text">{errors.main_image}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="additional_images" className="image-upload-label">Ảnh bổ sung</label>
            <input
              type="file"
              id="additional_images"
              name="additional_images"
              accept="image/*"
              multiple
              onChange={handleChange}
              ref={additionalImagesInputRef}
              style={{ display: 'none' }} // Hide the actual input
            />
            <button
              type="button"
              className="btn-add-images"
              onClick={handleAddMoreAdditionalImages}
            >
              Thêm ảnh khác
            </button>
            <div className="additional-images-preview">
              {additionalImagesPreviews.map((url, index) => (
                <div key={index} className="image-wrapper">
                  <img src={url} alt={`Additional Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleRemoveAdditionalImage(index)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Thêm Xe Máy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMotorbikeForm; 