import React, { useState } from "react";
import { FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState(""); // Bạn có thể tách thành 2 state nếu muốn

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch({ location, dateRange });
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar-field">
        <FaMapMarkerAlt className="search-bar-icon" />
        <input
          type="text"
          placeholder="Chọn địa điểm tìm xe"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </div>
      <div className="search-bar-field">
        <FaCalendarAlt className="search-bar-icon" />
        <input
          type="text"
          placeholder="20h00, 10/07/2025 đến 00h00, 13/07/2025"
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
        />
      </div>
      <button className="search-bar-btn" type="submit">TÌM XE</button>
    </form>
  );
};

export default SearchBar; 