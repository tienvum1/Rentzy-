import React from "react";
import { Car, MapPin, Fuel, Users, Heart, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./VehicleCard.css";

const VehicleCard = ({ vehicle }) => {
  const navigate = useNavigate();
  const { user, isLoading, favorites, toggleFavorite } = useAuth();
  const isFavorite =
    !isLoading && favorites.some((fav) => fav._id === vehicle._id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (!user) {
      alert("Vui lòng đăng nhập để yêu thích xe!");
      return;
    }
    toggleFavorite(vehicle);
  };

  const handleCardClick = () => {
    navigate(`/vehicles/${vehicle._id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="vehicle-card-pro" onClick={handleCardClick} tabIndex={0}>
      <div className="vehicle-card-pro-img-wrap">
        <img
          src={vehicle.primaryImage || "/default-car.jpg"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-card-pro-img"
          loading="lazy"
        />
        <button
          className={`vehicle-card-pro-fav-btn${
            isFavorite ? " favorited" : ""
          }`}
          onClick={handleFavoriteClick}
          disabled={isLoading}
          title={isFavorite ? "Bỏ yêu thích xe này" : "Thêm vào xe yêu thích"}
        >
          <Heart
            fill={isFavorite ? "#ff4d4f" : "none"}
            color={isFavorite ? "#ff4d4f" : "#bbb"}
            size={22}
          />
        </button>
      </div>
      <div className="vehicle-card-pro-info">
        <div className="vehicle-card-pro-title-row">
          <span className="vehicle-card-pro-brand">{vehicle.brand}</span>
          <span className="vehicle-card-pro-model">{vehicle.model}</span>
        </div>
        <div className="vehicle-card-pro-location">
          <MapPin size={18} strokeWidth={2} />
          <span>{vehicle.location}</span>
        </div>
        <div className="vehicle-card-pro-specs">
          <div>
            <Users size={18} strokeWidth={2} /> {vehicle.seatCount} chỗ
          </div>
          <div>
            <Gauge size={18} strokeWidth={2} />{" "}
            {vehicle.transmission === "automatic" ? "Tự động" : "Số sàn"}
          </div>
          <div>
            <Fuel size={18} strokeWidth={2} />{" "}
            {vehicle.fuelType === "electric" ? "Điện" : "Xăng"}
          </div>
        </div>
        <div className="vehicle-card-pro-price-row">
          <span className="vehicle-card-pro-price">
            {formatCurrency(vehicle.pricePerDay)}
          </span>
          <span className="vehicle-card-pro-price-unit">/ngày</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
