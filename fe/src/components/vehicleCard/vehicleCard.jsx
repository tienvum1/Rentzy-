import React from 'react';
import { FaGasPump, FaChair, FaLocationDot } from 'react-icons/fa6';
import { IoSpeedometerOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import './VehicleCard.css';

const VehicleCard = ({ vehicle }) => {
    const navigate = useNavigate();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleCardClick = () => {
        navigate(`/vehicles/${vehicle._id}`);
    };

    return (
        <div className="vehicle-card" onClick={handleCardClick}>

            {/* Primary Image */}
            <div className="vehicle-card__image-container">
                <img 
                    src={vehicle.primaryImage} 
                    alt={`${vehicle.brand} ${vehicle.model}`} 
                    className="vehicle-card__image"
                />
                <div className="vehicle-card__image-overlay"></div>
            </div>



            {/* Vehicle Details */}
            <div className="vehicle-card__details">
                <h3 className="vehicle-card__title"> {vehicle.model}</h3>

                {/* Specs */}
                <div className="vehicle-card__specs">
                    <div className="vehicle-card__spec-item">
                        <IoSpeedometerOutline className="vehicle-card__icon" />
                        <span>{vehicle.transmission == 'automatic' ? 'Số tự động' : 'Số sàn'}</span>
                    </div>
                    <div className="vehicle-card__spec-item">
                        <FaChair className="vehicle-card__icon" />
                        <span>{vehicle.seatCount} chỗ</span>
                    </div>
                    <div className="vehicle-card__spec-item">
                        <FaGasPump className="vehicle-card__icon" />
                        <span>{vehicle.fuelType === 'electric' ? 'Điện' : vehicle.fuelType === 'gasoline' ? 'Xăng' : vehicle.fuelType}</span>
                    </div>
                </div>

                {/* Location */}
                <div className="vehicle-card__location">
                    <FaLocationDot className="vehicle-card__location-icon" />
                    <span>{vehicle.location}</span>
                </div>


                {/* Pricing */}
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
