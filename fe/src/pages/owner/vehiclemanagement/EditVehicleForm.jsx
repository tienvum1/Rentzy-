import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OwnerVehicleDetail.css';
import SidebarOwner from '../../../components/SidebarOwner/SidebarOwner';

const bodyTypeOptions = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Pickup'
];
const transmissionOptions = ['automatic', 'manual'];
const fuelTypeOptions = ['petrol', 'diesel', 'electric', 'hybrid'];
const availableFeatures = [
  'Bản đồ', 'Bluetooth', 'Camera 360', 'Camera cập lề', 'Camera hành trình', 'Camera lùi',
  'Cảm biến lốp', 'Cảm biến va chạm', 'Cảnh báo tốc độ', 'Cửa sổ trời', 'Định vị GPS',
  'Ghế trẻ em', 'Khe cắm USB', 'Lốp dự phòng', 'Màn hình DVD', 'Nắp thùng xe bán tải', 'ETC', 'Túi khí an toàn'
];

const EditVehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';
  const [vehicle, setVehicle] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/vehicles/${id}`);
        setVehicle(response.data.vehicle);
        setFormData({
          ...response.data.vehicle,
          main_image: null,
          gallery: [],
        });
        setMainImagePreview(response.data.vehicle.primaryImage);
        setGalleryPreviews(response.data.vehicle.gallery || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin xe.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVehicle();
  }, [id, backendUrl]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (name === 'main_image') {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, main_image: file }));
      setMainImagePreview(file ? URL.createObjectURL(file) : vehicle.primaryImage);
    } else if (name === 'gallery') {
      const newFiles = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...newFiles],
      }));
      setGalleryPreviews((prev) => [
        ...prev,
        ...newFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } else if (type === 'checkbox') {
      setFormData((prev) => {
        const features = prev.features || [];
        return {
          ...prev,
          features: features.includes(value)
            ? features.filter((f) => f !== value)
            : [...features, value],
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Xóa ảnh phụ khỏi preview và formData
  const handleRemoveGalleryImage = (idx) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.brand || !formData.model || !formData.licensePlate || !formData.location || !formData.pricePerDay || !formData.deposit || !formData.seatCount || !formData.bodyType || !formData.transmission || !formData.fuelType || !formData.description) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setMessage(null);
    const dataToSubmit = new FormData();
    dataToSubmit.append('brand', formData.brand);
    dataToSubmit.append('model', formData.model);
    dataToSubmit.append('licensePlate', formData.licensePlate);
    dataToSubmit.append('location', formData.location);
    dataToSubmit.append('pricePerDay', formData.pricePerDay);
    dataToSubmit.append('deposit', formData.deposit);
    dataToSubmit.append('seatCount', formData.seatCount);
    dataToSubmit.append('bodyType', formData.bodyType);
    dataToSubmit.append('transmission', formData.transmission);
    dataToSubmit.append('fuelType', formData.fuelType);
    dataToSubmit.append('fuelConsumption', formData.fuelConsumption || '');
    dataToSubmit.append('rentalPolicy', formData.rentalPolicy || '');
    dataToSubmit.append('description', formData.description);
    if (formData.main_image) dataToSubmit.append('main_image', formData.main_image);
    if (formData.gallery && formData.gallery.length > 0) {
      formData.gallery.forEach((file) => dataToSubmit.append('additional_images', file));
    }
    if (formData.features && formData.features.length > 0) {
      formData.features.forEach((f) => dataToSubmit.append('features', f));
    }
    // Nếu user xóa hết ảnh phụ, gửi thêm flag
    if ((formData.gallery && formData.gallery.length === 0) && galleryPreviews.length === 0) {
      dataToSubmit.append('clear_gallery', 'true');
    }
    try {
      const response = await axios.put(`${backendUrl}/api/vehicles/${id}`, dataToSubmit, { withCredentials: true });
      setMessage({ type: 'success', text: response.data.message || 'Cập nhật xe thành công!' });
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi khi cập nhật xe.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="owner-vehicle-detail-loading">Đang tải...</div>;
  if (error) return <div className="owner-vehicle-detail-error">{error}</div>;
  if (!formData) return null;

  return (
    <div className="owner-vehicle-detail-layout">
      <div className="owner-vehicle-detail-main">
        <div className="sidebar-owner-wrap">
          <SidebarOwner />
        </div>
        <div className="owner-vehicle-detail-content">
          <h2>Chỉnh sửa thông tin xe</h2>
          <form className="owner-vehicle-detail-card improved" onSubmit={handleSubmit}>
            <div className="owner-vehicle-detail-images">
              <label className="main-image-label">Ảnh chính:
                <input type="file" name="main_image" accept="image/*" onChange={handleChange} style={{ display: 'none' }} id="mainImageInput" />
                <img
                  src={mainImagePreview}
                  alt="Ảnh chính"
                  className="main-image clickable"
                  onClick={() => document.getElementById('mainImageInput').click()}
                  title="Click để đổi/chọn lại ảnh chính"
                />
              </label>
              <label className="gallery-label">Ảnh phụ:
                <button type="button" className="btn-add-images" onClick={() => galleryInputRef.current.click()}>Thêm ảnh phụ</button>
                <input type="file" name="gallery" accept="image/*" multiple ref={galleryInputRef} onChange={handleChange} style={{ display: 'none' }} />
                <div className="gallery-images">
                  {galleryPreviews.map((img, idx) => (
                    <div key={idx} className="image-wrapper">
                      <img
                        src={img}
                        alt={`Ảnh phụ ${idx + 1}`}
                        className="gallery-image clickable"
                        onClick={() => setModalImage(img)}
                        title="Click để xem lớn"
                      />
                      <button type="button" className="btn-remove-image" onClick={() => handleRemoveGalleryImage(idx)}>×</button>
                    </div>
                  ))}
                </div>
              </label>
            </div>
            <div className="owner-vehicle-detail-info improved">
              <table className="vehicle-info-table">
                <tbody>
                  <tr><td>Thương hiệu:</td><td><input type="text" name="brand" value={formData.brand} onChange={handleChange} /></td></tr>
                  <tr><td>Dòng xe:</td><td><input type="text" name="model" value={formData.model} onChange={handleChange} /></td></tr>
                  <tr><td>Biển số:</td><td><input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} /></td></tr>
                  <tr><td>Địa điểm:</td><td><input type="text" name="location" value={formData.location} onChange={handleChange} /></td></tr>
                  <tr><td>Giá thuê/ngày:</td><td><input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} /></td></tr>
                  <tr><td>Tiền đặt cọc:</td><td><input type="number" name="deposit" value={formData.deposit} onChange={handleChange} /></td></tr>
                  <tr><td>Số chỗ:</td><td><input type="number" name="seatCount" value={formData.seatCount} onChange={handleChange} /></td></tr>
                  <tr><td>Thân xe:</td><td><select name="bodyType" value={formData.bodyType} onChange={handleChange}>{bodyTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></td></tr>
                  <tr><td>Hộp số:</td><td><select name="transmission" value={formData.transmission} onChange={handleChange}>{transmissionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></td></tr>
                  <tr><td>Nhiên liệu:</td><td><select name="fuelType" value={formData.fuelType} onChange={handleChange}>{fuelTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></td></tr>
                  <tr><td>Tiêu hao nhiên liệu:</td><td><input type="text" name="fuelConsumption" value={formData.fuelConsumption || ''} onChange={handleChange} /></td></tr>
                  <tr><td>Tính năng:</td><td>
                    <div className="features-grid">
                      {availableFeatures.map((feature) => (
                        <label key={feature} className="feature-checkbox">
                          <input
                            type="checkbox"
                            name="features"
                            value={feature}
                            checked={formData.features && formData.features.includes(feature)}
                            onChange={handleChange}
                          /> {feature}
                        </label>
                      ))}
                    </div>
                  </td></tr>
                  <tr><td>Điều khoản thuê:</td><td><textarea name="rentalPolicy" value={formData.rentalPolicy || ''} onChange={handleChange} rows="3" /></td></tr>
                  <tr><td>Mô tả:</td><td><textarea name="description" value={formData.description} onChange={handleChange} rows="4" /></td></tr>
                </tbody>
              </table>
              {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
              <div className="form-actions equal-buttons">
                <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Hủy</button>
              </div>
            </div>
          </form>
          {modalImage && (
            <div className="image-modal" onClick={() => setModalImage(null)}>
              <img src={modalImage} alt="Xem lớn" className="modal-img" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditVehicleForm; 