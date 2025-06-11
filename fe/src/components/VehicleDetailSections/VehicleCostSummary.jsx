import React from 'react';

const VehicleCostSummary = ({ rentalFee, discountAmount, vat, totalRentalFee, depositAmount, depositNote }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="vehicle-detail-section vehicle-cost-summary">
            <div className="cost-item">
                <span>Phí thuê xe</span>
                <strong>{formatCurrency(rentalFee)}</strong>
            </div>
            <div className="cost-item discount-item">
                <span>Giảm giá</span>
                <span className="discount-value">- {formatCurrency(discountAmount)}</span>
            </div>
            <div className="discount-promo">
                <i className="fa-solid fa-percent"></i> Áp dụng mã khuyến mãi / giới thiệu <i className="fa-solid fa-chevron-right"></i>
            </div>

            <div className="cost-item">
                <span>Thuế VAT</span>
                <strong>{formatCurrency(vat)}</strong>
            </div>
            <div className="cost-item total-cost">
                <span>Tổng cộng tiền thuê</span>
                <strong>{formatCurrency(totalRentalFee)}</strong>
            </div>

            <div className="cost-item deposit-item">
                <span>Tiền giữ chỗ <i className="fa-solid fa-circle-info"></i></span>
                <strong>{formatCurrency(depositAmount)}</strong>
                <p className="deposit-note">
                    Tiền giữ chỗ không phải phụ phí và sẽ được hoàn lại sau chuyến đi. Lưu ý: Tham khảo chính sách hoàn giữ chỗ khi huỷ chuyến.
                </p>
            </div>
            <div className="cost-item deposit-car-item">
                <span>Cọc xe</span>
                <strong>{formatCurrency(3000000)}</strong> {/* Static value for now as per image */}
                <p className="deposit-car-note">
                    Thanh toán khi nhận xe và kiểm tra xe, không nhận cọc xe máy. <br/>
                    Lưu ý: Mức cọc sẽ cao hơn đối với bằng lái mới được cấp dưới 1 năm, liên hệ CSKH để biết thêm chi tiết.
                </p>
            </div>
        </div>
    );
};

export default VehicleCostSummary; 