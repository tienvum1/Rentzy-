import React, { useState } from 'react';
import ProfileSidebar from './ProfileSidebar';
import Profile from './Profile';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import DriverLicenseVerification from './DriverLicenseVerification'
import FavoritesPage from './FavoritesPage';
import VehicleManagement from '../vehiclemanagement/VehicleManagement';
import UserBookings from './UserBookings';
import OwnerPage from '../owner/OwnerPage';
import TransactionHistory from './TransactionHistory';
import WalletInfo from './WalletInfo';
import ChangePassword from '../../pages/changePassword/ChangePassword';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import './ProfilePage.css'; // file CSS cho layout của trang

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('account'); // Có thể dùng switch-case để thay đổi nội dung
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSectionChange = (sectionId) => {
    if (sectionId === 'my-cars') {
      if (user && Array.isArray(user.role) && user.role.includes('owner')) {
        setActiveSection('my-cars');
      } else if (user && Array.isArray(user.role) && user.role.includes('admin')) {
        alert('Admin không có trang quản lý xe cá nhân!');
      } else {
        navigate('/consignForm');
      }
    } else if (sectionId === 'owner-management') {
      if (user && Array.isArray(user.role) && user.role.includes('owner')) {
        setActiveSection('owner-management');
      } else {
        navigate('/consignForm');
      }
    } else {
      setActiveSection(sectionId);
    }
  };

  return (
    <>   <Header />
    <div className="profile-page">
     
      <div className="profile-page__sidebar">
        <ProfileSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
      <div className="profile-page__content">
        {activeSection === 'account' && <Profile />}
        {activeSection === 'favorites' && <FavoritesPage />}
        {activeSection === 'my-cars' && <VehicleManagement />}
        {activeSection === 'my-bookings' && <UserBookings />}
        {activeSection === 'owner-management' && <OwnerPage />}
        {activeSection === 'transactions' && <TransactionHistory />}
        {activeSection === 'wallet' && <WalletInfo />}
        {activeSection === 'change-password' && <ChangePassword />}
        {activeSection === 'delete-account' && (
          <div style={{ padding: '2rem' }}>
            <h2>Chức năng xóa tài khoản đang được phát triển.</h2>
            <p>Vui lòng quay lại sau!</p>
          </div>
        )}
        {![
          'account', 'favorites', 'my-cars', 'my-bookings', 'owner-management', 'transactions', 'wallet', 'change-password', 'delete-account'
        ].includes(activeSection) && (
          <div style={{ padding: '2rem' }}>
            <h2>Chức năng "{activeSection}" đang được phát triển.</h2>
            <p>Vui lòng quay lại sau!</p>
          </div>
        )}
      </div>
    </div>
    <DriverLicenseVerification/>
    <Footer />
    </>
  );
};

export default ProfilePage;
