import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AvatarPopup from './AvatarPopup';
import './Profile.css';

const Profile = () => {
  const { user, isAuthenticated, isLoading, fetchUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    cccd_number: '',
    driver_license: '',
  });
  const [message, setMessage] = useState('');
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        cccd_number: user.cccd_number || '',
        driver_license: user.driver_license || '',
      });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Handle profile save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Update failed');
      setMessage('Profile updated successfully!');
      setEditMode(false);
      fetchUserProfile();
    } catch {
      setMessage('Error updating profile!');
    }
  };

  // Handle avatar save
  const handleAvatarSave = async (file) => {
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await fetch('/api/user/update-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Avatar update failed');
      setShowAvatarPopup(false);
      setMessage('Avatar updated successfully!');
      fetchUserProfile();
    } catch {
      setMessage('Error updating avatar!');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setMessage('');
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      cccd_number: user?.cccd_number || '',
      driver_license: user?.driver_license || '',
    });
  };

  // Render profile field
  const renderField = (label, value, key, editable = true) => (
    <div className="profile__field">
      <span className="profile__label">{label}:</span>
      {editMode && editable ? (
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          className="profile__input"
        />
      ) : value ? (
        <span className="profile__value">{value}</span>
      ) : (
        <span className="profile__empty">
          Not set
          {editMode && editable && (
            <button
              type="button"
              className="profile__add-btn"
              onClick={() => setForm((prev) => ({ ...prev, [key]: '' }))}
            >
              Add
            </button>
          )}
        </span>
      )}
    </div>
  );

  // Format date
  const formatDate = (date) => {
    if (!date || isNaN(Date.parse(String(date)))) return 'Invalid date';
    return new Date(String(date)).toLocaleDateString('vi-VN');
  };

  if (isLoading || !user) return <div>Loading...</div>;

  return (
    <>

      <div className="profile__bg">
        <div className="profile__card">
          {/* Avatar Section */}
          <div
            className="profile__avatar-wrap"
            onClick={() => setShowAvatarPopup(true)}
            role="button"
            tabIndex={0}
          >
            <img
              src={user.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt={user.name || 'User Avatar'}
              className="profile__avatar"
            />
            <span className="profile__avatar-edit">✏️</span>
          </div>
          <div className="profile__avatar-note">Click to change avatar</div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="profile__form">
            {renderField('Name', user.name, 'name')}
            <div className="profile__field">
              <span className="profile__label">Email:</span>
              <span className="profile__value">{user.email}</span>
            </div>
            {renderField('Phone', user.phone, 'phone')}
            {renderField('ID Number', user.cccd_number, 'cccd_number')}
            {renderField('Driver License', user.driver_license, 'driver_license')}
            <div className="profile__field">
              <span className="profile__label">Role:</span>
              <span className="profile__role">{user.role}</span>
            </div>
            <div className="profile__field">
              <span className="profile__label">Verification:</span>
              <span className={user.is_verified ? 'profile__verified' : 'profile__not-verified'}>
                {user.is_verified ? '✔️ Verified' : '❌ Not Verified'}
              </span>
            </div>
            <div className="profile__field">
              <span className="profile__label">Created:</span>
              <span className="profile__value">{formatDate(user.created_at)}</span>
            </div>
            {message && <div className="profile__msg">{message}</div>}
            <div className="profile__actions">
              {editMode ? (
                <>
                  <button type="submit" className="profile__save-btn">
                    Save Changes
                  </button>
                  <button type="button" className="profile__cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="profile__edit-btn"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              )}
              <button
                type="button"
                className="profile__logout-btn"
                onClick={() => logout()}
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
      <AvatarPopup
        open={showAvatarPopup}
        onClose={() => setShowAvatarPopup(false)}
        onSave={handleAvatarSave}
      />
    </>
  );
};

export default Profile;