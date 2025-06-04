import React from 'react';
import './VehicleCard.css';

const VehicleCard = ({
  image,
  name,
  seats,
  transmission,
  fuel,
  pricePerDay,
  location,
  isSaved,
  onSave,
  onViewDetails
}) => {
  return (
    <div className="car-card">
      <div className="car-card__image-container">
        <img src={image} alt={name} className="car-card__image" />
        <button className={`car-card__save-btn${isSaved ? ' saved' : ''}`} onClick={onSave}>
          {/* Bookmark icon SVG */}
          <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z"/>
          </svg>
        </button>
      </div>
      <div className="car-card__body">
        <div className="car-card__title">{name}</div>
        {location && <div className="car-card__location">{location}</div>}
        <div className="car-card__specs">
          {seats !== 'N/A' && (
          <span>
            {/* User icon */}
            <svg width="20" height="20" fill="none" stroke="#4ec9b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: 4}}>
              <circle cx="10" cy="7" r="4"/>
              <path d="M2 19c0-3.3 5.3-5 8-5s8 1.7 8 5"/>
            </svg>
            {seats} chỗ
          </span>
          )}
           {transmission !== 'N/A' && (
          <span>
            {/* Transmission icon */}
            <svg width="20" height="20" fill="none" stroke="#4ec9b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: 4}}>
              <circle cx="5" cy="15" r="2"/>
              <circle cx="15" cy="15" r="2"/>
              <circle cx="10" cy="5" r="2"/>
              <path d="M10 7v6"/>
              <path d="M7 15h6"/>
            </svg>
            {transmission}
          </span>
           )}
            {fuel !== 'N/A' && (
          <span>
            {/* Fuel icon */}
            <svg width="20" height="20" fill="none" stroke="#4ec9b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: 4}}>
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <path d="M7 7h6v6H7z"/>
            </svg>
            {fuel}
          </span>
            )}
        </div>
        <div className="car-card__price-row">
          {pricePerDay && pricePerDay !== 'N/A VNĐ' && <div className="car-card__price-day">{pricePerDay}</div>}
        </div>
        <button className="car-card__details-btn" onClick={onViewDetails}>
          View Details <span style={{marginLeft: 4}}>→</span>
        </button>
      </div>
    </div>
  );
};

export default VehicleCard;