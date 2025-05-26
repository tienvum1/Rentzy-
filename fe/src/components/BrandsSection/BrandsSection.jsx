import React from 'react';
import './BrandsSection.css';

const brands = [
  { name: 'Audi', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Audi_logo.png' },
  { name: 'Ford', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
  { name: 'Peugeot', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Peugeot_Logo.png' },
  { name: 'Volkswagen', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/VW_Logo.png' },
  { name: 'Bentley', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bentley_logo.png' },
  { name: 'Nissan', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Nissan_logo.png' },
  { name: 'Jeep', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Jeep_logo.png' },
  { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
];

const BrandsSection = () => {
  return (
    <div className="brands-section">
      <div className="brands-section__container">
        <h3 className="brands-section__title">We work with Premium Brands</h3>
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