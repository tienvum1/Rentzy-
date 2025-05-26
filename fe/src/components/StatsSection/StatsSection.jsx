import React from 'react';
import './StatsSection.css';

const stats = [
  { value: '200M', label: 'CARS FOR SALE' },
  { value: '350M', label: 'DEALER REVIEWS' },
  { value: '70M', label: 'VISITORS PER DAY' },
  { value: '150M', label: 'VISITORS PER DAY' },
];

const StatsSection = () => {
  return (
    <div className="stats-section">
      {stats.map((stat, idx) => (
        <div className="stat" key={idx}>
          <div className="stat__value">{stat.value}</div>
          <div className="stat__label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsSection; 