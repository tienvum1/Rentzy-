import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import AvatarPopup from './AvatarPopup';
import './Profile.css';


const Profile = () => {
  const { user, isAuthenticated, isLoading, fetchUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // State cho chỉnh sửa
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    cccd_number: user?.cccd_number || '',
    driver_license: user?.driver_license || ''
  });
  const [msg, setMsg] = useState('');
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [driverLicenseFront, setDriverLicenseFront] = useState(null);
  const [driverLicenseBack, setDriverLicenseBack] = useState(null);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        cccd_number: user.cccd_number || '',
        driver_license: user.driver_license || ''
      });
    }
    // eslint-disable-next-line
  }, [isAuthenticated, isLoading, user]);

  // Xử lý lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('cccd_number', form.cccd_number);
      formData.append('driver_license', form.driver_license);
      if (driverLicenseFront) formData.append('driver_license_front', driverLicenseFront);
      if (driverLicenseBack) formData.append('driver_license_back', driverLicenseBack);
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      setMsg('Cập nhật thành công!');
      setEditMode(false);
      fetchUserProfile();
    } catch {
      setMsg('Có lỗi xảy ra khi cập nhật!');
    }
  };

  // Xử lý đổi avatar
  const handleAvatarSave = async (file) => {
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/user/update-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      setShowAvatarPopup(false);
      setMsg('Đổi ảnh thành công!');
      fetchUserProfile();
    } catch {
      setMsg('Có lỗi khi đổi ảnh!');
    }
  };


  if (isLoading || !user) return <div>Đang tải thông tin...</div>;

  // Helper hiển thị trường chưa có
  const renderField = (label, value, key, editable = true) => (
    <div className="profile__field">
      <span className="profile__label">{label}:</span>{' '}
      {editMode && editable ? (
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="profile__input"
        />
      ) : value ? (
        <span className="profile__value">{value}</span>
      ) : (
        <span className="profile__empty">
          Chưa có{' '}
          {editMode && editable && (
            <button
              type="button"
              className="profile__add-btn"
              onClick={() => setForm(f => ({ ...f, [key]: '' }))}
            >
              Thêm
            </button>
          )}
        </span>
      )}
    </div>
  );

  return (
    <>
      <Header />
      <div className="profile__bg">
        <div className="profile__card">
          {/* Avatar + Đổi ảnh */}
          <div className="profile__avatar-wrap" onClick={() => setShowAvatarPopup(true)}>
            <img
              src={user.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt={user.name || 'User Avatar'}
              className="profile__avatar"
            />
            <span className="profile__avatar-edit">✏️</span>
          </div>
          <div className="profile__avatar-note">Click vào avatar để đổi ảnh</div>
          {/* Form thông tin cá nhân */}
          <form onSubmit={handleSaveProfile} className="profile__form">
            {renderField('Tên', form.name, 'name')}
            <div className="profile__field">
              <span className="profile__label">Email:</span>{' '}
              <span className="profile__value">{user.email}</span>
            </div>
            {renderField('Số điện thoại', form.phone, 'phone')}
            {renderField('CCCD', form.cccd_number, 'cccd_number')}
            {editMode ? (
              <>
                <div className="profile__field">
                  <span className="profile__label">Ảnh mặt trước bằng lái:</span>
                  <input type="file" accept="image/*" onChange={e => setDriverLicenseFront(e.target.files[0])} />
                  {user.driver_license_front_url && (
                    <img src={user.driver_license_front_url} alt="Mặt trước bằng lái" style={{maxWidth: 180, borderRadius: 8, border: '1px solid #eee', marginLeft: 12}} />
                  )}
                </div>
                <div className="profile__field">
                  <span className="profile__label">Ảnh mặt sau bằng lái:</span>
                  <input type="file" accept="image/*" onChange={e => setDriverLicenseBack(e.target.files[0])} />
                  {user.driver_license_back_url && (
                    <img src={user.driver_license_back_url} alt="Mặt sau bằng lái" style={{maxWidth: 180, borderRadius: 8, border: '1px solid #eee', marginLeft: 12}} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="profile__field">
                  <span className="profile__label">Ảnh mặt trước bằng lái:</span>
                  {user.driver_license_front_url ? (
                    <img src={user.driver_license_front_url} alt="Mặt trước bằng lái" style={{maxWidth: 180, borderRadius: 8, border: '1px solid #eee'}} />
                  ) : (
                    <span className="profile__empty">Chưa có</span>
                  )}
                </div>
                <div className="profile__field">
                  <span className="profile__label">Ảnh mặt sau bằng lái:</span>
                  {user.driver_license_back_url ? (
                    <img src={user.driver_license_back_url} alt="Mặt sau bằng lái" style={{maxWidth: 180, borderRadius: 8, border: '1px solid #eee'}} />
                  ) : (
                    <span className="profile__empty">Chưa có</span>
                  )}
                </div>
              </>
            )}
            <div className="profile__field">
              <span className="profile__label">Vai trò:</span>{' '}
              <span className="profile__role">{user.role}</span>
            </div>
            <div className="profile__field">
              <span className="profile__label">Trạng thái xác thực:</span>{' '}
              <span className={user.is_verified ? 'profile__verified' : 'profile__not-verified'}>
                {user.is_verified ? '✔️ Đã xác thực' : '❌ Chưa xác thực'}
              </span>
            </div>
            <div className="profile__field">
              <span className="profile__label">Ngày tạo:</span>{' '}
              <span className="profile__value">
  {user?.created_at && !isNaN(Date.parse(String(user.created_at)))
    ? new Date(String(user.created_at)).toLocaleDateString('vi-VN')
    : 'Ngày không hợp lệ'}
</span>



            </div>
            {msg && <div className="profile__msg">{msg}</div>}
            {editMode && (
              <div className="profile__actions">
                <button type="submit" className="profile__save-btn">Lưu thay đổi</button>
                <button type="button" className="profile__cancel-btn" onClick={() => { setEditMode(false); setMsg(''); setForm({
                  name: user.name || '', phone: user.phone || '', cccd_number: user.cccd_number || '', driver_license: user.driver_license || ''
                }); setDriverLicenseFront(null); setDriverLicenseBack(null); }}>Hủy</button>
              </div>
            )}
          </form>
          {!editMode && (
            <div className="profile__actions">
              <button type="button" className="profile__edit-btn" onClick={() => { setEditMode(true); setForm({
                name: user.name || '', phone: user.phone || '', cccd_number: user.cccd_number || '', driver_license: user.driver_license || ''
              }); setMsg(''); }}>
                Chỉnh sửa hồ sơ
              </button>
            </div>
          )}
        </div>
      </div>
      <AvatarPopup open={showAvatarPopup} onClose={() => setShowAvatarPopup(false)} onSave={handleAvatarSave} />
      <Footer />
    </>
  );
};

export default Profile;