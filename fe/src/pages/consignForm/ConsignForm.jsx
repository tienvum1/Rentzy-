import React, { useState } from 'react';
import axios from 'axios'; // Assuming you'll use axios for API calls
import { useAuth } from '../../context/AuthContext'; // To get user info and possibly refresh profile
import './ConsignForm.css';
import RentalSteps from './RentalSteps';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';

// Remove initialState and constants related to car and consignment details
// const initialState = { ... };
// const carBrands = [ ... ];
// const carModels = { ... };
// const years = [ ... ];
// const locations = [ ... ];
// const ownerTypes = [ ... ];

const ConsignForm = () => {
  const { user, fetchUserProfile } = useAuth();

  // Define state for user-related fields needed for owner registration
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    cccd_number: user?.cccd_number || '',
    cccd_front_image: null,
    cccd_back_image: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value,
    });
    setError('');
    setSuccess('');
  };

  // No longer need handleBrandChange
  // const handleBrandChange = e => { ... };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.cccd_number || !formData.cccd_front_image || !formData.cccd_back_image) {
      setError('Vui lòng điền đầy đủ Họ tên, Số điện thoại, Số CCCD/CMND và tải lên ảnh cả hai mặt CCCD/CMND.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('cccd_number', formData.cccd_number);
    data.append('cccd_front_image', formData.cccd_front_image);
    data.append('cccd_back_image', formData.cccd_back_image);

    try {
      const response = await axios.put(`${backendUrl}/api/user/become-owner`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Thông tin của bạn đã được gửi. Chúng tôi sẽ xem xét và cập nhật vai trò chủ xe cho bạn.');
        fetchUserProfile();
      } else {
        setError(response.data.message || 'Đã có lỗi xảy ra khi gửi thông tin.');
      }
    } catch (err) {
      console.error('Error submitting become owner form:', err);
      setError('Đã có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại.');
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Header/>
    <div className="consign-main-bg">
      <div className="consign-main-container">
        <div className="consign-form-left">
          <h2 className="consign-title">
            Đăng ký trở thành Chủ xe <span className="brand-highlight">Rentzy</span>
          </h2>
          <p className="consign-desc">
            Cung cấp thông tin cá nhân và ảnh CCCD/CMND để được xét duyệt trở thành Chủ xe và bắt đầu cho thuê xe trên Rentzy.
          </p>
          <form className="consign-form" onSubmit={handleSubmit}>
            {/* Remove car-related form rows */}
            {/* <div className="form-row"> ... </div> */}
            {/* <div className="form-row"> ... </div> */}

            {/* Add fields for owner registration */}
          

            {/* Add fields for name and phone */}
            <div className="form-group">
              <label htmlFor="name">Họ tên *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cccd_number">Số CCCD/CMND *</label>
              <input
                type="text"
                id="cccd_number"
                name="cccd_number"
                value={formData.cccd_number}
                onChange={handleChange}
                required
              />
            </div>

            {/* Add fields for CCCD images */}
            <div className="form-group">
              <label htmlFor="cccd_front_image">Ảnh mặt trước CCCD/CMND *</label>
              <input
                type="file"
                id="cccd_front_image"
                name="cccd_front_image"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cccd_back_image">Ảnh mặt sau CCCD/CMND *</label>
              <input
                type="file"
                id="cccd_back_image"
                name="cccd_back_image"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </div>

            {/* Remove driver license fields */}
            {/*
            <div className="form-group">
              <label htmlFor="driver_license_front">Ảnh mặt trước Bằng lái xe *</label>
              <input
                type="file"
                id="driver_license_front"
                name="driver_license_front"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="driver_license_back">Ảnh mặt sau Bằng lái xe *</label>
              <input
                type="file"
                id="driver_license_back"
                name="driver_license_back"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </div>
            */}

            {/* Remove income estimate row */}
            {/* <div className="income-row"> ... </div> */}

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Gửi đăng ký'}
            </button>
          </form>
        </div>
      </div>
      <RentalSteps/>
    </div>
    <Footer />
    </>
  );
};

export default ConsignForm;
