import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-time-picker';
import { toast } from 'react-toastify';
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-toastify/dist/ReactToastify.css";
import './VehicleBookingSection.css';
import DateTimeSelector from '../DateTimeSelector/DateTimeSelector';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [returnLocation, setReturnLocation] = useState(vehicle.location);
  const [pickupTime, setPickupTime] = useState('08:00');
  const [returnTime, setReturnTime] = useState('17:00');

  // Discount/promo states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // State để lưu các ngày đã được đặt
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // State để điều khiển việc hiển thị modal chọn ngày giờ
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  // Thêm useAuth và useNavigate
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  // Fetch các ngày đã được đặt của xe
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/vehicle/${vehicle._id}/dates`);
        setBookedDates(response.data.bookedDates);
      } catch (error) {
        toast.error('Lỗi khi lấy thông tin lịch đặt xe.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookedDates();
  }, [vehicle._id]);

  // Callback từ DateTimeSelector khi người dùng xác nhận
  const handleDateTimeSelect = (data) => {
    if (data) {
      setSelectedDates({ startDate: data.startDate, endDate: data.endDate });
      setPickupTime(data.pickupTime);
      setReturnTime(data.returnTime);
    }
    setShowDateTimeModal(false);
  };

  // Đã loại bỏ hàm calculateBookingDetails. Logic được nhúng trực tiếp vào useMemo.

  const otherCosts = React.useMemo(() => ({
    deposit: vehicle.deposit,
    deliveryFee: pickupLocation !== vehicle.location ? 200000 : 0,
  }), [pickupLocation, vehicle.deposit]);

  const bookingDetails = React.useMemo(() => {
    if (!selectedDates.startDate || !selectedDates.endDate || !pickupTime || !returnTime) {
      return {
        totalDays: 0,
        rentalFee: 0,
        deliveryFee: 0,
        finalAmount: 0
      };
    }

    // Chuyển đổi ngày và giờ đã chọn thành đối tượng Date với múi giờ Việt Nam
    const start = new Date(`${selectedDates.startDate}T${pickupTime}:00+07:00`);
    const end = new Date(`${selectedDates.endDate}T${returnTime}:00+07:00`);

    if (isNaN(start.getTime())) {
      return { totalDays: 0, rentalFee: 0, deliveryFee: 0, finalAmount: 0 };
    }
    if (isNaN(end.getTime())) {
      return { totalDays: 0, rentalFee: 0, deliveryFee: 0, finalAmount: 0 };
    }

    // Tính số ngày thuê
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let totalDays = 0;
    if (diffTime === 0) {
      totalDays = 0;
    } else if (diffTime <= (24 * 60 * 60 * 1000)) {
      totalDays = 1;
    } else {
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const rentalFee = totalDays * vehicle.pricePerDay;
    const deliveryFee = pickupLocation !== vehicle.location ? 200000 : 0;
    const finalAmount = rentalFee + deliveryFee - discountAmount;

    return {
      totalDays,
      rentalFee,
      deliveryFee,
      finalAmount,
    };
  }, [selectedDates.startDate, selectedDates.endDate, pickupTime, returnTime, discountAmount, pickupLocation, vehicle.pricePerDay]);

  const totalCost = React.useMemo(() => bookingDetails.finalAmount, [bookingDetails.finalAmount]);

  const holdFee = vehicle.holdFee || 500000;

  const totalBeforeDiscount = React.useMemo(
    () => totalCost + otherCosts.deposit + otherCosts.deliveryFee + holdFee,
    [totalCost, otherCosts.deposit, otherCosts.deliveryFee, holdFee]
  );

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
    if (location === vehicle.location) {
      // Nếu chọn nhận xe tại vị trí xe
      setPickupLocation(vehicle.location);
      setReturnLocation(vehicle.location);
    } else {
      // Nếu chọn giao xe tận nơi
      setPickupLocation('delivery');
      setReturnLocation('delivery');
    }
  };

  // Thêm hàm xử lý khi thay đổi địa chỉ
  const handleAddressChange = (e) => {
    const newAddress = e.target.value;
    if (pickupLocation !== vehicle.location) {
      setPickupLocation(newAddress);
      setReturnLocation(newAddress);
    }
  };

  // Cập nhật hàm handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (bookingDetails.finalAmount <= 0) {
      toast.error('Tổng số tiền phải lớn hơn 0.');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để đặt xe.');
      navigate('/login');
      return;
    }

    try {
      // Format dates for API
      const formatDateForAPI = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${year}-${month}-${day}`;
      };

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/createBooking`, {
        vehicleId: vehicle._id,
        startDate: formatDateForAPI(selectedDates.startDate),
        endDate: formatDateForAPI(selectedDates.endDate),
        pickupLocation: pickupLocation,
        returnLocation: returnLocation,
        pickupTime: pickupTime,
        returnTime: returnTime,
        totalDays: bookingDetails.totalDays,
        totalAmount: bookingDetails.finalAmount,
        promoCode: selectedPromo ? selectedPromo.code : null,
        discountAmount: discountAmount
      }, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (onBookNow) {
          onBookNow(response.data.data.booking._id, response.data.data.transaction._id, response.data.data.booking.totalAmount);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Booking error:', error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra khi đặt xe.');
    }
  };

  const formatDisplayDate = (dateString, timeString) => {
    if (!dateString || !timeString) return 'Chưa chọn';
    
    // Parse date and time components
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create date object with local timezone
    const date = new Date(year, month - 1, day, hours, minutes);
    
    if (isNaN(date.getTime())) {
        return 'Thời gian không hợp lệ';
    }
    
    // Format with Vietnam locale
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
  };

  return (
    <div className="vehicle-booking-section">
      <div className="pricing-section">
        <h3>Giá thuê và thời gian</h3>
        <div className="price-per-day">
          <span className="price">{vehicle.pricePerDay.toLocaleString('vi-VN')} VND</span>
          <span className="unit">/ ngày</span>
        </div>

        {/* Nút mở modal chọn thời gian */}
        <button 
          className="select-datetime-button"
          onClick={() => setShowDateTimeModal(true)}
        >
          <span>📅</span> Chọn thời gian thuê xe
        </button>

        {/* Hiển thị thời gian đã chọn */}
        {selectedDates.startDate && selectedDates.endDate && (
          <div className="selected-datetime">
            <div className="datetime-item">
              <span className="label">Nhận xe:</span>
              <span className="value">
                {formatDisplayDate(selectedDates.startDate, pickupTime)}
              </span>
            </div>
            <div className="datetime-item">
              <span className="label">Trả xe:</span>
              <span className="value">
                {formatDisplayDate(selectedDates.endDate, returnTime)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal chọn thời gian */}
      {showDateTimeModal && (
        <DateTimeSelector
          bookedDates={bookedDates}
          onDateTimeChange={handleDateTimeSelect}
          initialStartDate={selectedDates.startDate}
          initialEndDate={selectedDates.endDate}
          initialPickupTime={pickupTime}
          initialReturnTime={returnTime}
        />
      )}

      {/* Phần địa điểm nhận xe */}
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
                  value={pickupLocation === 'delivery' ? '' : pickupLocation}
                  onChange={handleAddressChange}
                  placeholder="Nhập địa chỉ nhận xe (số nhà, tên đường, phường, quận,...)"
                  className="pickup-address-input"
                />
              ) : (
                <span style={{ color: '#bbb' }}>Chọn địa điểm</span>
              )}
            </div>
            <div className="pickup-fee-info">
              Phí giao xe (2 chiều): 200.000đ - Chủ xe sẽ tự giao và nhận xe
            </div>
          </div>
        </div>
        {pickupLocation !== vehicle.location && (
          <div className="delivery-note" style={{ marginTop: 8 }}>
            <p>* Chủ xe sẽ tự giao xe đến địa chỉ của bạn và nhận xe khi kết thúc thuê</p>
            <p>* Phí giao xe 200.000đ đã bao gồm cả 2 chiều</p>
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
              <span>Phí giao xe (2 chiều)</span>
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
          <div className="cost-item total">
            <span>Tổng cộng</span>
            <span>
              {(totalBeforeDiscount - discountAmount).toLocaleString('vi-VN')} VND
            </span>
          </div>
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
        onClick={handleSubmit}
        disabled={!selectedDates.startDate || !selectedDates.endDate || (pickupLocation !== vehicle.location && !pickupLocation)}
      >
        Đặt xe ngay
      </button>
      <div className="terms-agreement">
        Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với khoản sử dụng và Chính sách bảo mật
      </div>
    </div>
  );
};

export default VehicleBookingSection; 