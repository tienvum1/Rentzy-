import React from 'react';

const VehiclePricingOptions = () => {
    // Placeholder data, this would ideally come from props or API
    const pricing = [
        { hours: 4, price: '550K' },
        { hours: 8, price: '770K' },
        { hours: 12, price: '880K' },
        { hours: 24, price: '1100K' },
    ];
    const discount = '462K';

    return (
        <div className="vehicle-pricing-options">
            <div className="pricing-grid">
                {pricing.map((item, index) => (
                    <div key={index} className="pricing-item">
                        <strong>{item.price}</strong>/{item.hours} giờ
                    </div>
                ))}
            </div>
            <div className="discount-badge">
                <i className="fa-solid fa-tags"></i> Giảm {discount}
            </div>
            <p className="pricing-note">
                Đơn giá gói chỉ áp dụng cho ngày thường. Giá ngày Lễ/Tết có thể điều chỉnh theo nhu cầu.
            </p>
        </div>
    );
};

export default VehiclePricingOptions; 