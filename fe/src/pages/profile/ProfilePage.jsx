import React, { useState } from 'react';
import ProfileSidebar from './ProfileSidebar';
import Profile from './Profile';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import DriverLicenseVerification from './DriverLicenseVerification'

import './ProfilePage.css'; // file CSS cho layout của trang

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('account'); // Có thể dùng switch-case để thay đổi nội dung

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
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
        {/* Các component khác như Favorites, MyCars... có thể thêm vào sau */}
        {activeSection !== 'account' && (
          <div style={{ padding: '2rem' }}>
            <h2>Chức năng “{activeSection}” đang được phát triển.</h2>
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
