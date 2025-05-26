import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer__top">
      <div className="footer__col footer__brand">
        <div className="footer__logo-row">
          <img src="https://cdn-icons-png.flaticon.com/512/743/743007.png" alt="Rentzy Logo" className="footer__logo" />
          <span className="footer__brand-name">Rentzy</span>
        </div>
        <p className="footer__desc">
          Rentzy - Nền tảng thuê xe hiện đại, an toàn và tiện lợi hàng đầu Việt Nam.<br />
          Đặt xe nhanh chóng, giá minh bạch, dịch vụ tận tâm.
        </p>
        <div className="footer__socials">
          <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" /></a>
          <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" alt="Instagram" /></a>
          <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="X" /></a>
          <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" /></a>
        </div>
      </div>
      <div className="footer__col footer__contact">
        <div className="footer__contact-item">
          <span className="footer__icon orange"><img src="https://cdn-icons-png.flaticon.com/512/535/535239.png" alt="Address" /></span>
          <div>
            <div className="footer__contact-label">Address</div>
            <div className="footer__contact-value"><b>123 Nguyen Trai, Hanoi, Vietnam</b></div>
          </div>
        </div>
        <div className="footer__contact-item">
          <span className="footer__icon orange"><img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" /></span>
          <div>
            <div className="footer__contact-label">Email</div>
            <div className="footer__contact-value"><b>support@rentzy.vn</b></div>
          </div>
        </div>
        <div className="footer__contact-item">
          <span className="footer__icon orange"><img src="https://cdn-icons-png.flaticon.com/512/597/597177.png" alt="Phone" /></span>
          <div>
            <div className="footer__contact-label">Phone</div>
            <div className="footer__contact-value"><b>+84 987 654 321</b></div>
          </div>
        </div>
      </div>
      <div className="footer__col">
        <div className="footer__col-title">Useful links</div>
        <ul className="footer__links">
          <li><a href="#">About Rentzy</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">How it works</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">F.A.Q</a></li>
        </ul>
      </div>
      <div className="footer__col">
        <div className="footer__col-title">Vehicles</div>
        <ul className="footer__links">
          <li><a href="#">Sedan</a></li>
          <li><a href="#">SUV</a></li>
          <li><a href="#">Hatchback</a></li>
          <li><a href="#">Pickup</a></li>
          <li><a href="#">Minivan</a></li>
        </ul>
      </div>
      <div className="footer__col">
        <div className="footer__col-title">Download App</div>
        <div className="footer__apps">
          <a href="#"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" /></a>
          <a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" /></a>
        </div>
      </div>
    </div>
    <div className="footer__bottom">
      © {new Date().getFullYear()} Rentzy. All rights reserved.
    </div>
  </footer>
);

export default Footer;