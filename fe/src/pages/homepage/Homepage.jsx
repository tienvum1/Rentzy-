import React from 'react';
import './Homepage.css';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import HeroSection from '../../components/heroSection/HeroSection';
import StatsSection from '../../components/statsSection/StatsSection';
import BrandsSection from '../../components/brandsSection/BrandsSection';
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