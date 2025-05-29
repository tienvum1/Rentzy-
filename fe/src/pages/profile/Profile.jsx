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
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
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
            {renderField('Tên', user.name, 'name')}
            <div className="profile__field">
              <span className="profile__label">Email:</span>{' '}
              <span className="profile__value">{user.email}</span>
            </div>
            {renderField('Số điện thoại', user.phone, 'phone')}
            {renderField('CCCD', user.cccd_number, 'cccd_number')}
            {renderField('Bằng lái', user.driver_license, 'driver_license')}
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
            <div className="profile__actions">
              {editMode ? (
                <>
                  <button type="submit" className="profile__save-btn">Lưu thay đổi</button>
                  <button type="button" className="profile__cancel-btn" onClick={() => { setEditMode(false); setMsg(''); setForm({
                    name: user.name || '', phone: user.phone || '', cccd_number: user.cccd_number || '', driver_license: user.driver_license || ''
                  }); }}>Hủy</button>
                </>
              ) : (
                <button type="button" className="profile__edit-btn" onClick={() => setEditMode(true)}>Chỉnh sửa hồ sơ</button>
              )}
           
            </div>
          </form>
        </div>
      </div>
      <AvatarPopup open={showAvatarPopup} onClose={() => setShowAvatarPopup(false)} onSave={handleAvatarSave} />
      <Footer />
    </>
  );
};

export default Profile;