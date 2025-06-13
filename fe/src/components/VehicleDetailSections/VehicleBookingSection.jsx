import React, { useState } from 'react';
import './VehicleBookingSection.css';

const PROMO_LIST = [
  {
    code: 'BONBON15',
    title: 'Giảm 15% (tối đa 999.999đ)',
    desc: 'Giảm 15% tối đa 1 triệu cho đơn từ 2,2 triệu',
    time: 'Thời gian thuê xe từ 01/03/2025 00:00 đến 31/08/2025 23:59',
    valid: 'Có giá trị từ ngày 09/04/2025 00:00 đến hết ngày 31/08/2025 00:00',
    note: 'Không áp dụng chung với các CTKM khác',
    left: 1379,
    percent: 0.15,
    max: 999999,
    minOrder: 2200000,
  },
  {
    code: 'BONBON12',
    title: 'Giảm 12% (tối đa 500.000đ)',
    desc: 'Giảm 12% tối đa 500k cho đơn từ 1,5 triệu',
    time: 'Thời gian thuê xe từ 01/04/2025 00:00 đến 31/08/2025 23:59',
    valid: 'Có giá trị từ ngày 09/04/2025 00:00 đến hết ngày 31/08/2025 00:00',
    note: 'Không áp dụng chung với các CTKM khác',
    left: 500,
    percent: 0.12,
    max: 500000,
    minOrder: 1500000,
  },
];

const VehicleBookingSection = ({ vehicle, onBookNow }) => {
  const [selectedDates, setSelectedDates] = useState({
    startDate: null,
    endDate: null,
  });

  const [pickupLocation, setPickupLocation] = useState(vehicle.location);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('08:00');
  const [returnTime, setReturnTime] = useState('17:00');

  // Discount/promo states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Tính toán tổng chi phí
  const calculateTotalCost = () => {
    if (!selectedDates.startDate || !selectedDates.endDate) return 0;
    const start = new Date(`${selectedDates.startDate}T${pickupTime}`);
    const end = new Date(`${selectedDates.endDate}T${returnTime}`);
    let days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    // Nếu còn dư giờ/phút hoặc giờ trả > giờ nhận thì tính thêm 1 ngày
    if (
      end > start &&
      (end.getHours() > start.getHours() ||
        (end.getHours() === start.getHours() && end.getMinutes() > start.getMinutes()) ||
        days === 0)
    ) {
      days += 1;
    }
    return days * vehicle.pricePerDay;
  };

  // Tính toán các chi phí khác
  const calculateOtherCosts = () => {
    const totalCost = calculateTotalCost();
    const deliveryFee = pickupLocation !== vehicle.location ? 200000 : 0;

    return {
      deposit: vehicle.deposit,
      serviceFee: totalCost * 0.1, // Phí dịch vụ 10%
      insurance: totalCost * 0.05, // Bảo hiểm 5%
      deliveryFee, // Phí giao xe
    };
  };

  const otherCosts = calculateOtherCosts();
  const totalCost = calculateTotalCost();

  const holdFee = vehicle.holdFee || 500000; // 500.000đ mặc định

  // Tính tổng trước giảm
  const totalBeforeDiscount =
    totalCost +
    otherCosts.deposit +
    otherCosts.serviceFee +
    otherCosts.insurance +
    otherCosts.deliveryFee +
    holdFee;

  // Tính giảm giá khi chọn mã
  const handleApplyPromo = (promo) => {
    setSelectedPromo(promo);
    setPromoCode(promo.code);
    // Tính giảm giá
    let discount = 0;
    if (totalBeforeDiscount >= promo.minOrder) {
      discount = Math.min(totalBeforeDiscount * promo.percent, promo.max);
    }
    setDiscountAmount(discount);
    setShowPromoModal(false);
  };

  // Bỏ mã giảm giá
  const handleRemovePromo = () => {
    setSelectedPromo(null);
    setPromoCode('');
    setDiscountAmount(0);
  };

  const handleBoxSelect = (location) => {
    setPickupLocation(location);
    if (location === vehicle.location) setPickupAddress('');
  };

  const handleBookNow = () => {
    onBookNow({
      ...selectedDates,
      pickupLocation,
      pickupAddress: pickupLocation !== vehicle.location ? pickupAddress : '',
      returnLocation: vehicle.location, // Luôn trả xe tại địa điểm xe
      pickupTime,
      returnTime,
      promoCode,
      discountAmount,
    });
  };

  return (
    <div className="vehicle-booking-section">
      {/* Phần giá và thời gian thuê */}
      <div className="pricing-section">
        <h3>Giá thuê và thời gian</h3>
        <div className="price-per-day">
          <span className="price">{vehicle.pricePerDay.toLocaleString('vi-VN')} VND</span>
          <span className="unit">/ ngày</span>
        </div>
        <div className="date-picker">
          <div className="date-input">
            <label>Ngày nhận xe</label>
            <input
              type="date"
              value={selectedDates.startDate}
              onChange={(e) => setSelectedDates({ ...selectedDates, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="time-input"
            />
          </div>
          <div className="date-input">
            <label>Ngày trả xe</label>
            <input
              type="date"
              value={selectedDates.endDate}
              onChange={(e) => setSelectedDates({ ...selectedDates, endDate: e.target.value })}
              min={selectedDates.startDate || new Date().toISOString().split('T')[0]}
            />
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="time-input"
            />
          </div>
        </div>
      </div>

      {/* Phần địa điểm nhận xe - UI đẹp với 2 box chọn */}
      <div className="pickup-section">
        <h3>Địa điểm nhận xe</h3>
        <div className="pickup-boxes">
          {/* Box 1: Nhận xe tại vị trí xe */}
          <div
            className={`pickup-box${pickupLocation === vehicle.location ? ' selected' : ''}`}
            onClick={() => handleBoxSelect(vehicle.location)}
          >
            <input
              type="checkbox"
              checked={pickupLocation === vehicle.location}
              onChange={() => handleBoxSelect(vehicle.location)}
              tabIndex={-1}
            />
            <b>Nhận xe tại vị trí xe</b>
            <div className="pickup-location-label">
              <span role="img" aria-label="location"></span> {vehicle.location}
            </div>
          </div>
          {/* Box 2: Giao xe tận nơi */}
          <div
            className={`pickup-box${pickupLocation !== vehicle.location ? ' selected' : ''}`}
            onClick={() => handleBoxSelect('delivery')}
          >
            <input
              type="checkbox"
              checked={pickupLocation !== vehicle.location}
              onChange={() => handleBoxSelect('delivery')}
              tabIndex={-1}
            />
            <b style={{ color: '#1abc9c' }}>Giao xe tận nơi</b>
            <div className="pickup-location-label">
              <span role="img" aria-label="location"></span>
              {pickupLocation !== vehicle.location ? (
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhận xe (số nhà, tên đường, phường, quận,...)"
                  className="pickup-address-input"
                />
              ) : (
                <span style={{ color: '#bbb' }}>Chọn địa điểm</span>
              )}
            </div>
            <div className="pickup-fee-info">
              Phí giao xe (1 chiều): 25k/km, phụ phí sân bay 50k, thời gian giao xe: 6am - 10pm. Phí giao xe tối thiểu 150k.
            </div>
          </div>
        </div>
        {pickupLocation !== vehicle.location && (
          <div className="delivery-note" style={{ marginTop: 8 }}>
            <p>* Xe sẽ được trả tại địa điểm giao xe </p>
          </div>
        )}
      </div>

      {/* Tóm tắt chi phí */}
      <div className="cost-summary">
        <h3>Tổng chi phí</h3>
        <div className="cost-details">
          <div className="cost-item">
            <span>Giá thuê xe</span>
            <span>{totalCost.toLocaleString('vi-VN')} VND</span>
          </div>
          <div className="cost-item">
            <span>Tiền đặt cọc</span>
            <span>{otherCosts.deposit.toLocaleString('vi-VN')} VND</span>
          </div>
          {otherCosts.deliveryFee > 0 && (
            <div className="cost-item">
              <span>Phí giao xe</span>
              <span>{otherCosts.deliveryFee.toLocaleString('vi-VN')} VND</span>
            </div>
          )}
          <div className="cost-item">
            <span>Tiền giữ chỗ</span>
            <span>{holdFee.toLocaleString('vi-VN')} VND</span>
          </div>
          {/* Discount section */}
          <div className="cost-item">
            <span>
              <b>Giảm giá</b>
              <div style={{ fontWeight: 400, fontSize: 13, color: '#444' }}>
                {selectedPromo ? selectedPromo.title : 'Khuyến mãi mặc định'}
              </div>
            </span>
            <span style={{ color: '#e74c3c', fontWeight: 600 }}>
              -{discountAmount > 0 ? discountAmount.toLocaleString('vi-VN') : 0}đ
            </span>
          </div>
          <div style={{ margin: '8px 0 0 0', width: '100%' }}>
            <button
              className="apply-promo-btn"
              type="button"
              onClick={() => setShowPromoModal(true)}
              style={{
                width: '100%',
                background: '#e8fff6',
                color: '#16a085',
                border: '2px solid #16a085',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
                padding: '12px 0',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>💸</span> Áp dụng mã khuyến mãi / giới thiệu <span style={{ fontSize: 18 }}>➔</span>
            </button>
            {selectedPromo && (
              <button
                type="button"
                style={{
                  marginTop: 6,
                  background: 'none',
                  color: '#e74c3c',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  textDecoration: 'underline',
                }}
                onClick={handleRemovePromo}
              >
                Bỏ mã khuyến mãi
              </button>
            )}
          </div>
          <div className="cost-item total">
            <span>Tổng cộng</span>
            <span>
              {(totalBeforeDiscount - discountAmount).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      </div>

      {/* Popup mã khuyến mãi */}
      {showPromoModal && (
        <div className="promo-modal-overlay">
          <div className="promo-modal">
            <div className="promo-modal-header">
              <b>Mã khuyến mãi / giới thiệu</b>
              <button
                className="promo-modal-close"
                onClick={() => setShowPromoModal(false)}
                aria-label="Đóng"
              >✕</button>
            </div>
            <input
              className="promo-input"
              type="text"
              placeholder="Nhập mã khuyến mãi"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              style={{ margin: '16px 0', width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #16a085', fontSize: 16 }}
            />
            <div className="promo-list">
              {PROMO_LIST.filter(p => !promoCode || p.code.includes(promoCode)).map(promo => (
                <div key={promo.code} className="promo-item">
                  <div className="promo-item-left">
                    <div className="promo-icon">💸</div>
                  </div>
                  <div className="promo-item-main">
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{promo.code}</div>
                    <div style={{ color: '#16a085', fontWeight: 500 }}>{promo.title}</div>
                    <div style={{ fontSize: 14, color: '#444', margin: '2px 0' }}>{promo.desc}</div>
                    <div style={{ fontSize: 13, color: '#e67e22', margin: '2px 0' }}>{promo.time}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{promo.valid}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{promo.note}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>Số lượng còn lại: {promo.left}</div>
                  </div>
                  <div className="promo-item-action">
                    <button
                      className="promo-apply-btn"
                      onClick={() => handleApplyPromo(promo)}
                    >Áp Dụng</button>
                  </div>
                </div>
              ))}
              {PROMO_LIST.filter(p => !promoCode || p.code.includes(promoCode)).length === 0 && (
                <div style={{ color: '#e74c3c', textAlign: 'center', margin: '20px 0' }}>
                  Không tìm thấy mã phù hợp
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nút đặt xe */}
      <button
        className="book-now-button"
        onClick={handleBookNow}
        disabled={!selectedDates.startDate || !selectedDates.endDate || (pickupLocation !== vehicle.location && !pickupAddress)}
      >
        Đặt xe ngay
      </button>
      <>Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với

              khoản sử dụng và Chính sách bảo mật</>
    
    </div>
  );
};

export default VehicleBookingSection; 