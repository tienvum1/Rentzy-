import React, { useState } from 'react';
import './DriverLicenseVerification.css';
import { FaPen } from 'react-icons/fa';

const DriverLicenseVerification = () => {
  const [form, setForm] = useState({
    licenseNumber: '',
    fullName: '',
    birthDate: '1970-01-01',
  });

  const [editMode, setEditMode] = useState(false);
  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="dlx__card">
      <div className="dlx__header">
        <h2>Giấy phép lái xe</h2>
        <span className="dlx__badge">🔴 Chưa xác thực</span>
        <button className="dlx__edit-btn" onClick={() => setEditMode(!editMode)}>
          Chỉnh sửa <FaPen size={12} />
        </button>
      </div>

      <div className="dlx__alert">
        <strong>Lưu ý:</strong> để tránh phát sinh vấn đề trong quá trình thuê xe, 
        <span className="highlight"> người đặt xe </span> trên hệ thống (đã xác thực GPLX) 
        <strong> ĐỒNG THỜI </strong> phải là <span className="highlight">người nhận xe</span>.
      </div>

      <div className="dlx__form">
        <div className="dlx__image-upload">
          <label>Hình ảnh</label>
          {image ? (
            <img src={image} alt="Uploaded GPLX" className="dlx__preview" />
          ) : (
            <label className="dlx__upload-placeholder">
              <input type="file" hidden onChange={handleImageUpload} />
              <span>📤</span>
            </label>
          )}
        </div>

        <div className="dlx__info">
          <label>Số GPLX</label>
          <input
            type="text"
            name="licenseNumber"
            disabled={!editMode}
            placeholder="Nhập số GPLX đã cấp"
            value={form.licenseNumber}
            onChange={handleChange}
          />
          <label>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            disabled={!editMode}
            placeholder="Nhập đầy đủ họ tên"
            value={form.fullName}
            onChange={handleChange}
          />
          <label>Ngày sinh</label>
          <input
            type="date"
            name="birthDate"
            disabled={!editMode}
            value={form.birthDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="dlx__footer-note">
        Vì sao tôi phải xác thực GPLX ❓
      </div>
    </div>
  );
};

export default DriverLicenseVerification;
