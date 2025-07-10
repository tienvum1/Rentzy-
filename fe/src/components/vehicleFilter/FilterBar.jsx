import React, { useState, useRef, useEffect } from "react";
import { FaCrown, FaCarSide, FaIndustry, FaSlidersH, FaGasPump, FaMapMarkerAlt } from "react-icons/fa";
import "./FilterBar.css";
// Dummy icon components, bạn cần thay thế bằng icon thực tế hoặc import đúng
const PickupIcon = () => <FaCarSide />;
const HatchbackIcon = () => <FaCarSide />;
const MPV7Icon = () => <FaCarSide />;
const Sedan5Icon = () => <FaCarSide />;
const SUV5Icon = () => <FaCarSide />;
const SUV7Icon = () => <FaCarSide />;

// Nhiên liệu
export const fuelOptions = [
  { value: "gasoline", label: "Xăng" },
  { value: "diesel", label: "Dầu" },
  { value: "electric", label: "Điện" },
  { value: "hybrid", label: "Hybrid" }
];
// Loại xe
export const transmissionOptions = [
  { value: "manual", label: "Số sàn" },
  { value: "automatic", label: "Số tự động" }
];
// Khu vực xe (quận Đà Nẵng)
export const areaOptions = [
  { value: "Hai Chau", label: "Hải Châu" },
  { value: "Thanh Khe", label: "Thanh Khê" },
  { value: "Son Tra", label: "Sơn Trà" },
  { value: "Ngu Hanh Son", label: "Ngũ Hành Sơn" },
  { value: "Lien Chieu", label: "Liên Chiểu" },
  { value: "Cam Le", label: "Cẩm Lệ" },
  { value: "Hoa Vang", label: "Hòa Vang" }
];
// Số chỗ: như ảnh bạn gửi, có thể là object gồm icon, label, count
export const seatOptions = [
  { value: "pickup", label: "Bán Tải", count: 3, icon: <PickupIcon /> },
  { value: "hatchback", label: "HatchBack", count: 9, icon: <HatchbackIcon /> },
  { value: "mpv7", label: "MPV 7 chỗ", count: 23, icon: <MPV7Icon /> },
  { value: "sedan5", label: "Sedan 5 chỗ", count: 78, icon: <Sedan5Icon /> },
  { value: "suv5", label: "SUV 5 chỗ", count: 109, icon: <SUV5Icon /> },
  { value: "suv7", label: "SUV 7 chỗ", count: 124, icon: <SUV7Icon /> }
];
// Hãng xe (brand)
export const brandOptions = [
  "Toyota",
  "Kia",
  "Mazda",
  "Hyundai",
  "Honda",
  "VinFast",
  "Ford",
  "Mercedes-Benz"
].map(b => ({ value: b, label: b }));

const FilterBar = ({ onFilter, onSort }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selected, setSelected] = useState({
    seat: null,
    fuel: null,
    transmission: null,
    area: null,
    brand: null,
  });
  const barRef = useRef();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle chọn filter
  const handleSelect = (type, value) => {
    setSelected(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value
    }));
    if (onFilter) onFilter(type, value);
  };

  // Helper render dropdown
  const renderDropdown = (type, options) => (
    <div className="filter-dropdown">
      {options.map(opt => (
        <div
          key={opt.value}
          className={`dropdown-item${selected[type] === opt.value ? " selected" : ""}`}
          onClick={() => handleSelect(type, opt.value)}
          style={{ cursor: "pointer", padding: 10, borderRadius: 10, background: selected[type] === opt.value ? "#e6f7f6" : "#fff", fontWeight: selected[type] === opt.value ? 700 : 400, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          {opt.icon && <span>{opt.icon}</span>}
          <span>{opt.label}{typeof opt.count === 'number' ? ` (${opt.count} xe)` : ""}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="filter-bar" ref={barRef} style={{ position: "relative" }}>
      <button className="filter-btn active">Tất cả</button>
      <button className="filter-btn"><FaCrown /> Xe xịn</button>
      {/* Số chỗ */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="filter-btn"
          onClick={() => setOpenDropdown(openDropdown === 'seat' ? null : 'seat')}
        >
          <FaCarSide /> Số chỗ
        </button>
        {openDropdown === 'seat' && renderDropdown('seat', seatOptions)}
      </div>
      {/* Hãng xe */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="filter-btn"
          onClick={() => setOpenDropdown(openDropdown === 'brand' ? null : 'brand')}
        >
          <FaIndustry /> Hãng xe
        </button>
        {openDropdown === 'brand' && renderDropdown('brand', brandOptions)}
      </div>
      {/* Loại xe */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="filter-btn"
          onClick={() => setOpenDropdown(openDropdown === 'transmission' ? null : 'transmission')}
        >
          <FaSlidersH /> Loại xe
        </button>
        {openDropdown === 'transmission' && renderDropdown('transmission', transmissionOptions)}
      </div>
      {/* Nhiên liệu */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="filter-btn"
          onClick={() => setOpenDropdown(openDropdown === 'fuel' ? null : 'fuel')}
        >
          <FaGasPump /> Nhiên liệu
        </button>
        {openDropdown === 'fuel' && renderDropdown('fuel', fuelOptions)}
      </div>
      {/* Khu vực xe */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="filter-btn"
          onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}
        >
          <FaMapMarkerAlt /> Khu vực xe
        </button>
        {openDropdown === 'area' && renderDropdown('area', areaOptions)}
      </div>
      <button className="filter-btn sort-btn" onClick={onSort}>↕ Sắp xếp</button>
    </div>
  );
};

export default FilterBar;
