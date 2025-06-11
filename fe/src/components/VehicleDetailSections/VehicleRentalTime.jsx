import React from 'react';

const VehicleRentalTime = () => {
    // Placeholder data, this would ideally come from props or state
    const rentalStartDate = "00h00, 12/06/2025";
    const rentalEndDate = "04h00, 14/06/2025";

    return (
        <div className="vehicle-detail-section vehicle-rental-time">
            <div className="rental-time-header">
                <i className="fa-regular fa-calendar-days"></i>
                <h2>Thời gian thuê</h2>
            </div>
            <p>{rentalStartDate} đến {rentalEndDate}</p>
        </div>
    );
};

export default VehicleRentalTime; 