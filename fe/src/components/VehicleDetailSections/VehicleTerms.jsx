import React from 'react';
import './VehicleTerms.css';

const VehicleTerms = () => {
    const terms = [
        "Sử dụng xe đúng mục đích, không vi phạm pháp luật.",
        "Không cầm cố, cho thuê lại hoặc chuyển nhượng xe.",
        "Giữ gìn xe sạch sẽ, không hút thuốc, xả rác trong xe.",
        "Không chở hàng cấm, dễ cháy nổ hoặc thực phẩm nặng mùi.",
        "Thông báo ngay khi xảy ra tai nạn, hỏng hóc.",
        "Trả xe đúng giờ và đúng địa điểm đã thỏa thuận.",

    ];

    return (
        <div className="vehicle-terms">
            <h2 className="vehicle-terms__title">Điều khoản thuê xe</h2>
            <ul className="vehicle-terms__list">
                {terms.map((term, index) => (
                    <li key={index} className="vehicle-terms__item">
                        {term}
                    </li>
                ))}
            </ul>
            <p className="vehicle-terms__footer">
                Cảm ơn quý khách. Chúc bạn có chuyến đi an toàn và thú vị!
            </p>
        </div>
    );
};

export default VehicleTerms;
