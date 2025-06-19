import React, { useState, useEffect } from 'react';
import './DriverLicenseVerification.css';
import { FaPen } from 'react-icons/fa';
import axios from 'axios';

const DriverLicenseVerification = () => {
  const [form, setForm] = useState({
    licenseNumber: '',
    fullName: '',
    birthDate: '1970-01-01',
  });

  const [originalForm, setOriginalForm] = useState(null); // To store fetched data
  const [editMode, setEditMode] = useState(false);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null); // New file selected by user
  const [originalImage, setOriginalImage] = useState(null); // To store fetched image URL
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Fetch user's driver license info when component mounts
  useEffect(() => {
    const fetchDriverLicenseInfo = async () => {
      try {
        console.log('Fetching driver license info...');
        const response = await axios.get('/api/user/profile', {
          withCredentials: true
        });
        
        console.log('Response from /api/user/profile:', response.data);
        const userData = response.data.user; // Access user object from response.data
        console.log('userData extracted:', userData);

        if (userData) {
          const newForm = {
            licenseNumber: userData.driver_license_number || '',
            fullName: userData.driver_license_full_name || '',
            birthDate: userData.driver_license_birth_date ? userData.driver_license_birth_date.split('T')[0] : '1970-01-01',
          };
          setForm(newForm);
          setOriginalForm(newForm); // Store original fetched data

          if (userData.driver_license_front_url) {
            setImage(userData.driver_license_front_url);
            setOriginalImage(userData.driver_license_front_url); // Store original image URL
            console.log('Image URL set:', userData.driver_license_front_url);
          }
          
          // Update isVerified based on the new driver_license_verification_status
          if (userData.driver_license_verification_status === 'verified') {
            setIsVerified(true);
          } else {
            setIsVerified(false); // Can be pending or rejected
          }

          console.log('Form state after setting:', newForm);
          console.log('Verification Status:', userData.driver_license_verification_status);

        } else {
          console.log('No user data received.');
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Error fetching driver license info:', error);
      } finally {
        setIsLoading(false);
        console.log('Finished fetching driver license info. isLoading set to false.');
      }
    };

    fetchDriverLicenseInfo();
  }, []);

  const handleChange = (e) => {
    if (!editMode) return; // Only allow changes in edit mode
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    if (!editMode) return; // Only allow image upload in edit mode
    const selectedFile = e.target.files[0];
    console.log('Selected file:', selectedFile);
    if (selectedFile) {
      setImage(URL.createObjectURL(selectedFile));
      setFile(selectedFile); // Set the new file
      console.log('File set successfully');
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setFile(null); // Clear the new file
    // Keep originalImage for comparison/restoring if user cancels
  };

  const handleEditToggle = () => {
    if (editMode) { // If currently in edit mode, user is cancelling
      // Reset form and image to original fetched state
      setForm(originalForm || { licenseNumber: '', fullName: '', birthDate: '1970-01-01' });
      setImage(originalImage);
      setFile(null); // Clear any newly selected file
    }
    setEditMode(!editMode);
  };

  const handleSubmit = async () => {
    if (!editMode) return; // Only allow submission in edit mode

    console.log('Form data:', form);
    console.log('File (newly selected):', file);
    console.log('Image (current display):', image);
    console.log('Original Image:', originalImage);

    if (!form.licenseNumber || !form.fullName || !form.birthDate) {
      alert('Vui lòng điền đầy đủ thông tin GPLX.');
      return;
    }

    // Check if an image exists (either original or a new one)
    if (!image) { // If image is null, it means no original and no new file was set
      alert('Vui lòng tải lên ảnh mặt trước GPLX.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('driver_license_number', form.licenseNumber);
      formData.append('driver_license_full_name', form.fullName);
      formData.append('driver_license_birth_date', form.birthDate);
      
      // Only append the file if a new file was selected
      if (file) {
        formData.append('driver_license_front', file, file.name);
      }

      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      const response = await axios.post('/api/user/create-driver-license', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });
      
      if (response.data) {
        alert('Thông tin GPLX đã được cập nhật thành công!');
        setEditMode(false);
        setIsVerified(true);
        // Update original form and image with new saved data
        setOriginalForm(form); 
        setOriginalImage(image); // Update original image to the current displayed one
        setFile(null); // Clear the new file after successful submission
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin GPLX:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(error.response.data.message || 'Lỗi khi cập nhật thông tin GPLX. Vui lòng thử lại.');
      } else {
        alert('Lỗi khi cập nhật thông tin GPLX. Vui lòng thử lại.');
      }
    }
  };

  if (isLoading) {
    return <div className="dlx__loading">Đang tải thông tin...</div>;
  }

  return (
    <div className="dlx__card">
      <div className="dlx__header">
        <h2>Giấy phép lái xe</h2>
        <span className={`dlx__badge
          ${isVerified ? 'verified' : ''}
          ${originalForm && originalForm.driver_license_verification_status === 'pending' ? 'pending' : ''}
          ${originalForm && originalForm.driver_license_verification_status === 'rejected' ? 'rejected' : ''}
        `}>
          {
            isVerified 
              ? '✅ Đã xác thực' 
              : (originalForm && originalForm.driver_license_number && originalForm.driver_license_verification_status === 'pending'
                  ? '🟡 Đang chờ duyệt'
                  : (originalForm && originalForm.driver_license_number && originalForm.driver_license_verification_status === 'rejected'
                      ? '❌ Đã từ chối'
                      : '🔴 Chưa xác thực'
                    )
                )
          }
        </span>
        <button 
          className="dlx__edit-btn" 
          onClick={handleEditToggle}
        >
          {editMode ? 'Hủy' : 'Chỉnh sửa'} <FaPen size={12} />
        </button>
      </div>

      <div className="dlx__alert">
        <strong>Lưu ý:</strong> để tránh phát sinh vấn đề trong quá trình thuê xe, 
        <span className="highlight"> người đặt xe </span> trên hệ thống (đã xác thực GPLX) 
        <strong> ĐỒNG THỜI </strong> phải là <span className="highlight">người nhận xe</span>.
      </div>

      <div className="dlx__form">
        <div className="dlx__image-upload">
          <label>Ảnh mặt trước GPLX</label>
          {image ? (
            <div className="dlx__preview-container">
              <img src={image} alt="Ảnh mặt trước GPLX" className="dlx__preview" />
              {editMode && (
                <button 
                  className="dlx__remove-image" 
                  onClick={handleRemoveImage}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <label className={`dlx__upload-placeholder ${!editMode ? 'disabled' : ''}`}>
              <input 
                type="file" 
                accept="image/*"
                hidden 
                onChange={handleImageUpload}
                disabled={!editMode}
              />
              <span>📤 Tải lên ảnh mặt trước GPLX</span>
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

      {editMode && (
        <button className="dlx__submit-btn" onClick={handleSubmit}>
          Lưu thông tin
        </button>
      )}

      <div className="dlx__footer-note">
        Vì sao tôi phải xác thực GPLX ❓
      </div>
    </div>
  );
};

export default DriverLicenseVerification;
