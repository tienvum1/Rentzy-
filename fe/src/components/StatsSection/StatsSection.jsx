import React, { useEffect, useRef } from 'react';
import './StatsSection.css';
import { FaCarSide, FaSmile, FaMapMarkedAlt, FaStar } from 'react-icons/fa';

const stats = [
  { value: 68, label: 'Xe cho thuê tại Đà Nẵng', icon: <FaCarSide /> },
  { value: 1200, label: 'Khách hàng hài lòng', icon: <FaSmile /> },
  { value: 8, label: 'Quận/Huyện phục vụ', icon: <FaMapMarkedAlt /> },
  { value: 4.95, label: 'Điểm đánh giá trung bình', icon: <FaStar /> },
];

function useCountUp(ref, end, duration = 1200, decimals = 0) {
  useEffect(() => {
    if (!ref.current) return;
    let start = 0;
    let startTime = null;
    function animateCount(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const value = start + (end - start) * progress;
      ref.current.innerText = decimals ? value.toFixed(decimals) : Math.floor(value);
      if (progress < 1) requestAnimationFrame(animateCount);
    }
    requestAnimationFrame(animateCount);
  }, [end, duration, decimals, ref]);
}

const StatsSection = () => {
  // Khởi tạo refs một lần duy nhất
  const ref0 = useRef();
  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();
  useCountUp(ref0, stats[0].value, 1200, 0);
  useCountUp(ref1, stats[1].value, 1200, 0);
  useCountUp(ref2, stats[2].value, 1200, 0);
  useCountUp(ref3, stats[3].value, 1200, 2);
  const refs = [ref0, ref1, ref2, ref3];
  return (
    <section className="stats-section-pro">
      {stats.map((stat, idx) => (
        <div className="stat-pro" key={idx}>
          <div className="stat-icon-pro">{stat.icon}</div>
          <div className="stat-value-pro" ref={refs[idx]}></div>
          <div className="stat-label-pro">{stat.label}</div>
        </div>
      ))}
    </section>
  );
};

export default StatsSection; 