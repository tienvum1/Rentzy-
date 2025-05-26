import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header__logo">Rentalia</div>
      <nav className="header__nav">
        <a href="#" className="header__link">Home</a>
        <a href="#" className="header__link">Vehicles</a>
        <a href="#" className="header__link">Features</a>
        <a href="#" className="header__link">Contact</a>
      </nav>
      <div className="header__actions">
        <button className="header__login">Login</button>
        <button className="header__signup">Sign up</button>
      </div>
    </header>
  );
};

export default Header; 