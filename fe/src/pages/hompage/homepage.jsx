import React from 'react';
import './homepage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/footer/Footer';
import HeroSection from '../../components/HeroSection/HeroSection';
import StatsSection from '../../components/StatsSection/StatsSection';
import BrandsSection from '../../components/BrandsSection/BrandsSection';
import VehicleList from '../../components/vehicleCard/VehicleList';

function Homepage() {
  return (
    <div>
      <Header />
      <div className="homepage-container">
        <HeroSection />
        <StatsSection />
        <BrandsSection />
        <VehicleList />
      </div>
      <Footer />
    </div>
  );
}

export default Homepage;