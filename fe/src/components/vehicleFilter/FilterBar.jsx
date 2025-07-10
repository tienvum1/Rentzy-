import React from "react";
import { FaCrown, FaCarSide, FaIndustry, FaSlidersH, FaGasPump, FaMapMarkerAlt } from "react-icons/fa";
import "./FilterBar.css";

const FilterBar = ({ onFilter, onSort }) => (
  <div className="filter-bar">
    <button className="filter-btn active">Tất cả</button>
    <button className="filter-btn"><FaCrown /> Xe xịn</button>
    <button className="filter-btn"><FaCarSide /> Số chỗ</button>
    <button className="filter-btn"><FaIndustry /> Hãng xe</button>
    <button className="filter-btn"><FaSlidersH /> Loại xe</button>
    <button className="filter-btn"><FaGasPump /> Nhiên liệu</button>
    <button className="filter-btn"><FaMapMarkerAlt /> Khu vực xe</button>
    <button className="filter-btn sort-btn" onClick={onSort}>↕ Sắp xếp</button>
  </div>
);

export default FilterBar;
