import React from 'react';

const VehiclePricingAndAvailability = ({ pricePerDay }) => {
    return (
        <div className="vehicle-pricing-availability">
            <div className="price-per-day">
                <span>Giá thuê mỗi ngày:</span>
                <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricePerDay)}</strong>
            </div>
        </div>
    );
};

export default VehiclePricingAndAvailability; 