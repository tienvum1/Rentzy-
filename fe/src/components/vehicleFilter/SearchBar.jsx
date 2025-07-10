import React, { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import RentalTimeModal from "./RentalTimeModal";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [showModal, setShowModal] = useState(false);
  const [rentalTime, setRentalTime] = useState({
    pickupDate: "",
    pickupTime: "20:00",
    returnDate: "",
    returnTime: "20:00"
  });

  const handleTimeClick = () => setShowModal(true);

  const handleConfirmTime = (time) => setRentalTime(time);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch({ ...rentalTime });
  };

  // Hiển thị text thời gian đã chọn
  const timeText = rentalTime.pickupDate && rentalTime.returnDate
    ? `${rentalTime.pickupTime}, ${rentalTime.pickupDate} đến ${rentalTime.returnTime}, ${rentalTime.returnDate}`
    : "Chọn thời gian";

  return (
    <>
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-bar-field" onClick={handleTimeClick} style={{ cursor: "pointer" }}>
          <FaCalendarAlt className="search-bar-icon" />
          <span>{timeText}</span>
        </div>
        <button className="search-bar-btn" type="submit">TÌM XE</button>
      </form>
      <RentalTimeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmTime}
        initialValue={rentalTime}
      />
    </>
  );
};

export default SearchBar; 