import React from 'react';

const VehiclePickupDelivery = ({ vehicleLocation }) => {
    // This component will contain logic for both pickup at vehicle location and delivery
    // For now, only pickup at vehicle location is fully implemented based on the image.
    return (
        <div className="vehicle-detail-section vehicle-pickup-delivery">
            <div className="pickup-at-location">
                <input type="radio" id="pickup" name="delivery_option" value="pickup" defaultChecked />
                <label htmlFor="pickup">
                    <i className="fa-solid fa-circle-dot"></i>
                    Nhận xe tại vị trí xe
                </label>
                <div className="location-details">
                    <i className="fa-solid fa-location-dot"></i>
                    <p>{vehicleLocation}</p>
                    <p className="location-note">
                        Địa điểm cụ thể sẽ được hiện thị sau khi thanh toán thành công, và thời gian lấy xe 24/24
                    </p>
                </div>
            </div>

            <div className="deliver-to-location">
                <input type="radio" id="delivery" name="delivery_option" value="delivery" />
                <label htmlFor="delivery">
                    <i className="fa-regular fa-circle"></i>
                    Giao xe tận nơi
                </label>
                <div className="delivery-details">
                    <i className="fa-solid fa-location-dot"></i>
                    <span className="choose-location">Chọn địa điểm</span>
                    <p className="delivery-note">
                        Thời gian giao xe tận nơi từ 6h-22h. Vui lòng điều chỉnh giờ nhận xe.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VehiclePickupDelivery; 