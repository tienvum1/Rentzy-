import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero-section">
      <div className="hero-section__content">
        <h1 className="hero-section__title">
          Find the <br />
          Perfect Car <br />
          for <span className="highlight">Your Trip</span>
        </h1>
        <p className="hero-section__desc">
          Quick, easy, and at the best price. Whether you're planning a weekend getaway or a cross-country adventure, our diverse fleet and exceptional service ensure you get on the road effortlessly.
        </p>
        <div className="hero-section__buttons">
          <button className="btn btn-primary">Get Started</button>
          <button className="btn btn-secondary">Download App</button>
        </div>
        <div className="hero-section__stores">
          <div className="store">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/67/App_Store_%28iOS%29.svg" alt="Apple Store" className="store__icon" />
            <span>Download on the <b>Apple Store</b></span>
          </div>
          <div className="store">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="store__icon" />
            <span>Get it on <b>Google Play</b></span>
          </div>
        </div>
      </div>
      <div className="hero-section__image">
        <img src="https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg" alt="Car" />
      </div>
    </div>
  );
};
export default HeroSection; 