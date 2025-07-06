import React from 'react';
import './BrandsSection.css';

const brands = [
  { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.png' },
  { name: 'Kia', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Kia_logo_3.png' },
  { name: 'Mazda', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Mazda_Logo.png' },
  { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Hyundai_logo.svg' },
  { name: 'Honda', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda-logo.png' },
  { name: 'VinFast', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/VinFast_logo.svg' },
  { name: 'Ford', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
  { name: 'Mercedes-Benz', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
];

const BrandsSection = () => {
  return (
    <div className="brands-section">
      <div className="brands-section__container">
        <h3 className="brands-section__title">Đối tác thương hiệu nổi bật</h3>
        <div className="brands-section__logos">
          {brands.map((brand, idx) => (
            <div className="brand" key={idx}>
              <img src={brand.logo} alt={brand.name} className="brand__logo" />
              <div className="brand__name">{brand.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandsSection; 