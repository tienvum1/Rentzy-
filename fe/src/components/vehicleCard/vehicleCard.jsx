import React from 'react';
import { FaGasPump, FaChair, FaLocationDot, FaHeart } from 'react-icons/fa6';
import { IoSpeedometerOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './VehicleCard.css';

const VehicleCard = ({ vehicle }) => {
    const navigate = useNavigate();
    const { user, isLoading, favorites, toggleFavorite } = useAuth();
    
    // Xác định trạng thái yêu thích từ context một cách an toàn
    const isFavorite = !isLoading && favorites.some(fav => fav._id === vehicle._id);

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (isLoading) return; 
        if (!user) {
            alert('Vui lòng đăng nhập để yêu thích xe!');
            return;
        }
        toggleFavorite(vehicle);
    };

    const handleCardClick = () => {
        navigate(`/vehicles/${vehicle._id}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="vehicle-card" onClick={handleCardClick}>
            <div className="vehicle-card__image-container">
                <img 
                    src={vehicle.primaryImage} 
                    alt={`${vehicle.brand} ${vehicle.model}`} 
                    className="vehicle-card__image"
                />
                <div className="vehicle-card__image-overlay"></div>
                <button
                    className={`vehicle-card__favorite-btn${isFavorite ? ' favorited' : ''}`}
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    title={isFavorite ? 'Bỏ yêu thích xe này' : 'Thêm vào xe yêu thích'}
                >
                    <FaHeart style={{ color: isFavorite ? '#ff4d4f' : '#bbb', fontSize: '1.8rem', transition: 'color 0.2s' }} />
                </button>
            </div>

            <div className="vehicle-card__details">
                <h3 className="vehicle-card__title"> {vehicle.model}</h3>
                <div className="vehicle-card__specs">
                    <div className="vehicle-card__spec-item">
                        <IoSpeedometerOutline className="vehicle-card__icon" />
                        <span>{vehicle.transmission === 'automatic' ? 'Số tự động' : 'Số sàn'}</span>
                    </div>
                    <div className="vehicle-card__spec-item">
                        <FaChair className="vehicle-card__icon" />
                        <span>{vehicle.seatCount} chỗ</span>
                    </div>
                    <div className="vehicle-card__spec-item">
                        <FaGasPump className="vehicle-card__icon" />
                        <span>{vehicle.fuelType === 'electric' ? 'Điện' : 'Xăng'}</span>
                    </div>
                </div>
                <div className="vehicle-card__location">
                    <FaLocationDot className="vehicle-card__location-icon" />
                    <span>{vehicle.location}</span>
                </div>
                <div className="vehicle-card__pricing">
                    <div className="vehicle-card__price-display">
                        <span className="vehicle-card__original-price">{formatCurrency(vehicle.pricePerDay)}/ ngày</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;
