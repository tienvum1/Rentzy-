import React, { useState, useRef, useEffect } from 'react';
import './AddVehicleForm.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';

const bodyTypeOptions = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Pickup'
];
const transmissionOptions = ['Automatic', 'Manual'];
const fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
const availableFeatures = [
  'Bản đồ', 'Bluetooth', 'Camera 360', 'Camera cập lề', 'Camera hành trình', 'Camera lùi',
  'Cảm biến lốp', 'Cảm biến va chạm', 'Cảnh báo tốc độ', 'Cửa sổ trời', 'Định vị GPS',
  'Ghế trẻ em', 'Khe cắm USB', 'Lốp dự phòng', 'Màn hình DVD', 'Nắp thùng xe bán tải', 'ETC', 'Túi khí an toàn'
];

const AddVehicleForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brand: '', model: '', license_plate: '', location: '', price_per_day: '',
    deposit_required: '', seats: '', body_type: '', transmission: '', fuel_type: '',
    fuelConsumption: '', main_image: null, additional_images: [], features: [],
    rentalPolicy: '', description: ''
  });
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const additionalImagesInputRef = useRef(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'main_image') {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, main_image: file }));
      setMainImagePreview(file ? URL.createObjectURL(file) : null);
    } else if (name === 'additional_images') {
      const newFiles = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        additional_images: [...prev.additional_images, ...newFiles],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Feature toggle
  const handleFeatureToggle = (feature) => {
    setFormData((prev) => {
      const current = prev.features || [];
      return current.includes(feature)
        ? { ...prev, features: current.filter((f) => f !== feature) }
        : { ...prev, features: [...current, feature] };
    });
  };

  // Preview for additional images
  useEffect(() => {
    additionalImagesPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = formData.additional_images.map((file) => URL.createObjectURL(file));
    setAdditionalImagesPreviews(newPreviews);
    return () => { newPreviews.forEach((url) => URL.revokeObjectURL(url)); };
  }, [formData.additional_images]);

  // Remove additional image
  const handleRemoveAdditionalImage = (idx) => {
    setFormData((prev) => {
      const updated = [...prev.additional_images];
      updated.splice(idx, 1);
      return { ...prev, additional_images: updated };
    });
  };

  // Validate
  const validateForm = () => {
    const newErrors = {};
    if (!formData.brand.trim()) newErrors.brand = 'Bắt buộc';
    if (!formData.model.trim()) newErrors.model = 'Bắt buộc';
    if (!formData.license_plate.trim()) newErrors.license_plate = 'Bắt buộc';
    if (!formData.location.trim()) newErrors.location = 'Bắt buộc';
    if (!formData.price_per_day || Number(formData.price_per_day) <= 0) newErrors.price_per_day = 'Bắt buộc';
    if (!formData.deposit_required || Number(formData.deposit_required) < 0) newErrors.deposit_required = 'Bắt buộc';
    if (!formData.seats || Number(formData.seats) <= 0) newErrors.seats = 'Bắt buộc';
    if (!formData.body_type) newErrors.body_type = 'Bắt buộc';
    if (!formData.transmission) newErrors.transmission = 'Bắt buộc';
    if (!formData.fuel_type) newErrors.fuel_type = 'Bắt buộc';
    if (!formData.main_image) newErrors.main_image = 'Bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage(null);
    const dataToSubmit = new FormData();
    dataToSubmit.append('brand', formData.brand);
    dataToSubmit.append('model', formData.model);
    dataToSubmit.append('licensePlate', formData.license_plate);
    dataToSubmit.append('location', formData.location);
    dataToSubmit.append('pricePerDay', Number(formData.price_per_day));
    dataToSubmit.append('deposit', Number(formData.deposit_required));
    dataToSubmit.append('seatCount', Number(formData.seats));
    dataToSubmit.append('bodyType', formData.body_type);
    dataToSubmit.append('transmission', formData.transmission.toLowerCase());
    dataToSubmit.append('fuelType', formData.fuel_type.toLowerCase());
    dataToSubmit.append('fuelConsumption', formData.fuelConsumption);
    dataToSubmit.append('rentalPolicy', formData.rentalPolicy);
    dataToSubmit.append('description', formData.description);
    if (formData.main_image) dataToSubmit.append('main_image', formData.main_image);
    formData.additional_images.forEach((file) => dataToSubmit.append('additional_images', file));
    formData.features.forEach((f) => dataToSubmit.append('features', f));
    try {
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/vehicles/add`;
      const response = await axios.post(apiUrl, dataToSubmit, { withCredentials: true });
      if (response.status === 201) {
        setMessage({ type: 'success', text: response.data.message || 'Xe đã được thêm thành công!' });
        setTimeout(() => navigate('/vehiclemanagement'), 2000);
      } else {
        setMessage({ type: 'warning', text: response.data.message || 'Thêm xe thành công nhưng có cảnh báo.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi thêm xe.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-vehicle-layout">
      <div className="sidebar-owner-wrap">
        <SidebarOwner />
      </div>
      <div className="add-vehicle-form-main">
        <div className="add-vehicle-form-card">
          <h2>Đăng xe cho thuê</h2>
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
          {loading && <div className="form-loading">Đang xử lý...</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-section">
                <div className="form-group">
                  <label>Thương hiệu</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} />
                  {errors.brand && <span className="error">{errors.brand}</span>}
                </div>
                <div className="form-group">
                  <label>Dòng xe</label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} />
                  {errors.model && <span className="error">{errors.model}</span>}
                </div>
                <div className="form-group">
                  <label>Biển số xe</label>
                  <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} />
                  {errors.license_plate && <span className="error">{errors.license_plate}</span>}
                </div>
                <div className="form-group">
                  <label>Địa điểm</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} />
                  {errors.location && <span className="error">{errors.location}</span>}
                </div>
                <div className="form-group">
                  <label>Giá mỗi ngày (VND)</label>
                  <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleChange} min="0" />
                  {errors.price_per_day && <span className="error">{errors.price_per_day}</span>}
                </div>
                <div className="form-group">
                  <label>Tiền đặt cọc (VND)</label>
                  <input type="number" name="deposit_required" value={formData.deposit_required} onChange={handleChange} min="0" />
                  {errors.deposit_required && <span className="error">{errors.deposit_required}</span>}
                </div>
                <div className="form-group">
                  <label>Số chỗ ngồi</label>
                  <input type="number" name="seats" value={formData.seats} onChange={handleChange} min="1" />
                  {errors.seats && <span className="error">{errors.seats}</span>}
                </div>
               
              </div>
              <div className="form-section">
                <div className="form-group">
                  <label>Dạng thân xe</label>
                  <select name="body_type" value={formData.body_type} onChange={handleChange}>
                    <option value="">-- Chọn dạng thân xe --</option>
                    {bodyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  {errors.body_type && <span className="error">{errors.body_type}</span>}
                </div>
                <div className="form-group">
                  <label>Hộp số</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange}>
                    <option value="">-- Chọn hộp số --</option>
                    {transmissionOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.transmission && <span className="error">{errors.transmission}</span>}
                </div>
                <div className="form-group">
                  <label>Loại nhiên liệu</label>
                  <select name="fuel_type" value={formData.fuel_type} onChange={handleChange}>
                    <option value="">-- Chọn loại nhiên liệu --</option>
                    {fuelTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.fuel_type && <span className="error">{errors.fuel_type}</span>}
                </div>
                <div className="form-group">
                  <label>Tiêu hao nhiên liệu (ví dụ: 6.5 L/100km, 15 kWh/100km)</label>
                  <input
                    type="text"
                    name="fuelConsumption"
                    value={formData.fuelConsumption}
                    onChange={handleChange}
                    placeholder="6.5 L/100km hoặc 15 kWh/100km"
                  />
                </div>
                <div className="form-group">
                  <label>Tính năng</label>
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
              </div>
            </div>
            <div className="form-group full-width">
              <label>Điều khoản thuê xe (tùy chọn)</label>
              <textarea name="rentalPolicy" value={formData.rentalPolicy} onChange={handleChange} rows="4" placeholder="Nhập các điều khoản đặc biệt khi thuê xe này..." />
            </div>
            <div className="form-group full-width">
              <label>Mô tả</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="5" className={errors.description ? 'input-error' : ''} />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
            <div className="form-group full-width">
              <label>Ảnh chính</label>
              <input type="file" name="main_image" accept="image/*" onChange={handleChange} />
              {errors.main_image && <span className="error">{errors.main_image}</span>}
              {mainImagePreview && <img src={mainImagePreview} alt="Ảnh chính Preview" className="image-preview" />}
            </div>
            <div className="form-group full-width">
              <label>Ảnh phụ</label>
              <button type="button" onClick={() => additionalImagesInputRef.current.click()} className="btn-add-images">Thêm ảnh khác</button>
              <input type="file" multiple name="additional_images" accept="image/*" onChange={handleChange} ref={additionalImagesInputRef} style={{ display: 'none' }} />
              <div className="additional-images-preview">
                {additionalImagesPreviews.map((url, idx) => (
                  <div key={idx} className="image-wrapper">
                    <img src={url} alt={`Ảnh phụ ${idx}`} />
                    <button type="button" className="btn-remove-image" onClick={() => handleRemoveAdditionalImage(idx)}>X</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Đang thêm...' : 'Đăng xe cho thuê'}</button>
              <button type="button" className="btn-cancel" onClick={() => navigate('/vehiclemanagement')}>Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleForm;
