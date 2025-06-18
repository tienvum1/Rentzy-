import React from 'react';

const VehicleOwnerInfo = ({ ownerName }) => {
    // ownerName would come from props, currently hardcoded for demonstration
    const isBonbonCar = true; // Assuming BonbonCar is the owner based on the image

    return (
        <div className="vehicle-detail-section vehicle-owner-info">
            <h2>Thông tin chủ xe</h2>
            <div className="owner-status">
                {isBonbonCar ? (
                    <i className="fa-solid fa-circle-check bonbon-car-icon"></i>
                ) : (
                    <i className="fa-solid fa-circle-user owner-icon"></i>
                )}
                <p>Xe được vận hành bởi Rentzy</p>
                {/* Or if ownerName is passed: <p>Xe được vận hành bởi <strong>{ownerName}</strong></p>*/}
            </div>
        </div>
    );
};

export default VehicleOwnerInfo; 