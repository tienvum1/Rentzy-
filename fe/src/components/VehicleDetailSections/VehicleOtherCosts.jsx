import React from 'react';
import './VehicleOtherCosts.css';

const VehicleOtherCosts = () => {
    const fuelSurcharge = {
        price: "30,000₫ / lít",
        note: "Bonbon chỉ thu khi vạch xăng thấp hơn lúc nhận xe. Trả lại đúng vạch xăng như lúc nhận để không phải trả phí này."
    };
    const cleaningFee = {
        price: "120,000₫ - 150,000₫",
        note: "Vui lòng trả lại hiện trạng xe được vệ sinh như lúc nhận để không mất phí này."
    };

    return (
        <div className="vehicle-other-costs">
            <div className="section-header">Các chi phí khác</div>
            <div className="cost-item">
                <div className="cost-top">
                    <span className="cost-title">Phụ phí xăng</span>
                    <span className="cost-price">{fuelSurcharge.price}</span>
                </div>
                <p className="cost-note">{fuelSurcharge.note}</p>
            </div>
            <hr />
            <div className="cost-item">
                <div className="cost-top">
                    <span className="cost-title">Phí vệ sinh</span>
                    <span className="cost-price">{cleaningFee.price}</span>
                </div>
                <p className="cost-note">{cleaningFee.note}</p>
            </div>
        </div>
    );
};

export default VehicleOtherCosts;
