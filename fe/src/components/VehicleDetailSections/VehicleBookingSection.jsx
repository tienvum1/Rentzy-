import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    code: 'BONBON10',
    title: 'Giảm 10% (tối đa 50.000đ)',
    desc: 'Giảm 10% tối đa 50k cho đơn từ 1 triệu',
    time: 'Thời gian thuê xe từ 01/03/2025 00:00 đến 31/08/2025 23:59',
    valid: 'Có giá trị từ ngày 09/04/2025 00:00 đến hết ngày 31/08/2025 00:00',
    note: 'Không áp dụng chung với các CTKM khác',
    left: 2000,
    percent: 0.1,
    max: 50000,
    minOrder: 1000000,
  },
  {
    code: 'BONBON5',
    title: 'Giảm 5% (tối đa 30.000đ)',
    desc: 'Giảm 5% tối đa 30k cho đơn từ 500k',
    time: 'Thời gian thuê xe từ 01/04/2025 00:00 đến 31/08/2025 23:59',
    valid: 'Có giá trị từ ngày 09/04/2025 00:00 đến hết ngày 31/08/2025 00:00',
    note: 'Không áp dụng chung với các CTKM khác',
    left: 1000,
    percent: 0.05,
    max: 30000,
    minOrder: 500000,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State để điều khiển việc hiển thị modal chọn ngày giờ
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  // State để điều khiển xác nhận đặt xe
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Thêm useAuth và useNavigate
  const { user, isAuthenticated, token } = useAuth();
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

  // Xóa otherCosts, không còn deposit

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
    const finalAmount = rentalFee + deliveryFee;

    return {
      totalDays,
      rentalFee,
      deliveryFee,
      finalAmount,
    };
  }, [selectedDates.startDate, selectedDates.endDate, pickupTime, returnTime, pickupLocation, vehicle.pricePerDay]);

  // Tính tổng tiền trước giảm giá (không còn deposit)
  const totalBeforeDiscount = React.useMemo(() => {
    const baseAmount = bookingDetails.rentalFee + bookingDetails.deliveryFee;
    return baseAmount;
  }, [bookingDetails.rentalFee, bookingDetails.deliveryFee]);

  // Tính giảm giá khi chọn mã
  const handleApplyPromo = (promo) => {
    console.log('Selected promo:', promo);
    console.log('Current booking details:', bookingDetails);
    
    setSelectedPromo(promo);
    setPromoCode(promo.code);
    
    // Tính giảm giá chỉ trên tiền thuê xe
    let discount = 0;
    
    // Kiểm tra điều kiện áp dụng mã
    if (bookingDetails.rentalFee >= promo.minOrder) {
      // Tính giảm giá dựa trên tiền thuê xe (promo.percent đã là số phần trăm)
      const calculatedDiscount = Math.floor(bookingDetails.rentalFee * promo.percent );
      console.log('Discount calculation details:', {
        rentalFee: bookingDetails.rentalFee,
        promoPercent: promo.percent,
        calculatedDiscount,
        maxDiscount: promo.max
      });
      
      // Lấy giá trị nhỏ hơn giữa giảm giá tính được và giới hạn tối đa
      discount = Math.min(calculatedDiscount, promo.max);
    } else {
      console.log('Minimum order not met:', {
        rentalFee: bookingDetails.rentalFee,
        minOrder: promo.minOrder
      });
    }
    
    console.log('Final discount amount:', discount);
    setDiscountAmount(discount);
    setShowPromoModal(false);
  };

  // Cập nhật useEffect để log khi bookingDetails thay đổi
  React.useEffect(() => {
    console.log('Booking details updated:', bookingDetails);
    if (selectedPromo) {
      console.log('Recalculating discount for selected promo:', selectedPromo);
      handleApplyPromo(selectedPromo);
    }
  }, [bookingDetails]);

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

  // Cập nhật hàm onBookNow để bao gồm kiểm tra
  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để đặt xe.');
      navigate('/login');
      return;
    }
    if (!user || !user.is_phone_verified) {
      toast.error('Vui lòng xác thực số điện thoại trong hồ sơ của bạn trước khi đặt xe.');
      navigate('/profile');
      return;
    }
    // Nếu đã xác thực, gọi hàm onBookNow gốc
    if (onBookNow) {
      onBookNow();
    }
  };

  // Cập nhật hàm handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (bookingDetails.finalAmount <= 0) {
      toast.error('Tổng số tiền phải lớn hơn 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Format dates for API
      const formatDateForAPI = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${year}-${month}-${day}`;
      };

      // Tổng tiền thực tế (chỉ để hiển thị, không thanh toán ngay)
      const totalAmount = bookingDetails.rentalFee + bookingDetails.deliveryFee - discountAmount;

      // Không còn gửi tiền cọc
      // const depositToPay = vehicle.deposit;

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/createBooking`, {
        vehicleId: vehicle._id,
        startDate: formatDateForAPI(selectedDates.startDate),
        endDate: formatDateForAPI(selectedDates.endDate),
        pickupLocation: pickupLocation === 'delivery' ? '' : pickupLocation,
        returnLocation: returnLocation === 'delivery' ? '' : returnLocation,
        pickupTime: pickupTime,
        returnTime: returnTime,
        totalDays: bookingDetails.totalDays,
        totalCost: bookingDetails.rentalFee,
        totalAmount: totalAmount,
        promoCode: selectedPromo ? selectedPromo.code : null,
        discountAmount: discountAmount,
        // deposit: depositToPay, // Xóa dòng này
        isDelivery: pickupLocation !== vehicle.location,
        deliveryFee: bookingDetails.deliveryFee
      }, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (response.data.success) {
        if (onBookNow) {
          onBookNow(response.data.data.booking._id, null, null); // Không truyền tiền cọc
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Booking error:', error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra khi đặt xe.');
    } finally {
      setIsSubmitting(false);
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
      {/* Phần giá và thời gian */}
      <section className="pricing-section">
        <h3>Giá thuê và thời gian</h3>
        <div className="price-per-day">
          <span className="price">{vehicle.pricePerDay.toLocaleString('vi-VN')} VND</span>
          <span className="unit">/ ngày</span>
        </div>

        <button 
          className="select-datetime-button"
          onClick={() => setShowDateTimeModal(true)}
        >
          <span>📅</span> Chọn thời gian thuê xe
        </button>

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
      </section>

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
      <section className="pickup-section">
        <h3>Địa điểm nhận xe</h3>
        <div className="pickup-boxes">
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
            <div className="pickup-box-content">
              <b>Nhận xe tại vị trí xe</b>
              <div className="pickup-location-label">
                <span role="img" aria-label="location"></span> {vehicle.location}
              </div>
            </div>
          </div>
          
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
            <div className="pickup-box-content">
              <b style={{ color: '#1abc9c' }}>Giao xe tận nơi</b>
              <div className="pickup-location-label">
                <span role="img" aria-label="location"></span>
                <div className="address-input-wrapper">
                  {pickupLocation !== vehicle.location ? (
                    <input
                      type="text"
                      value={pickupLocation === 'delivery' ? '' : pickupLocation}
                      onChange={handleAddressChange}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Nhập địa chỉ nhận xe"
                      className="pickup-address-input"
                    />
                  ) : (
                    <span className="placeholder">Chọn địa điểm</span>
                  )}
                </div>
              </div>
              <div className="pickup-fee-info">
                Phí giao xe (2 chiều): 200.000đ - Chủ xe sẽ tự giao và nhận xe
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phần tổng chi phí */}
      <section className="cost-summary">
        <h3>Tổng chi phí</h3>
        <div className="cost-details">
          <div className="cost-item">
            <span>Giá thuê xe</span>
            <span>{bookingDetails.rentalFee.toLocaleString('vi-VN')} VND</span>
          </div>
          {bookingDetails.deliveryFee > 0 && (
            <div className="cost-item">
              <span>Phí giao xe (2 chiều)</span>
              <span>{bookingDetails.deliveryFee.toLocaleString('vi-VN')} VND</span>
            </div>
          )}
          <div className="cost-item">
            <span>
              <b>Giảm giá</b>
              <div className="promo-description">
                {selectedPromo ? `Giảm ${selectedPromo.percent}% (tối đa ${selectedPromo.max.toLocaleString('vi-VN')}đ)` : 'Khuyến mãi mặc định'}
              </div>
            </span>
            <span className="discount-amount">
              -{discountAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {/* Xóa phần hiển thị tiền cọc xe */}
          <div className="cost-item total">
            <span>Tổng cộng</span>
            <span>
              {(bookingDetails.rentalFee + bookingDetails.deliveryFee - discountAmount).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        <div className="promo-actions">
          <button
            className="apply-promo-btn"
            type="button"
            onClick={() => setShowPromoModal(true)}
          >
            <span role="img" aria-label="money-bag">💸</span> 
            Áp dụng mã khuyến mãi / giới thiệu 
            <span role="img" aria-label="arrow-right">➔</span>
          </button>
          {selectedPromo && (
            <button
              type="button"
              className="remove-promo-btn"
              onClick={handleRemovePromo}
            >
              Bỏ mã khuyến mãi
            </button>
          )}
        </div>
      </section>

      {/* Modal mã khuyến mãi */}
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
            />
            <div className="promo-list">
              {PROMO_LIST.filter(p => !promoCode || p.code.includes(promoCode)).map(promo => (
                <div key={promo.code} className="promo-item">
                  <div className="promo-item-left">
                    <div className="promo-icon">💸</div>
                  </div>
                  <div className="promo-item-main">
                    <div className="promo-code">{promo.code}</div>
                    <div className="promo-title">{promo.title}</div>
                    <div className="promo-desc">{promo.desc}</div>
                    <div className="promo-time">{promo.time}</div>
                    <div className="promo-valid">{promo.valid}</div>
                    <div className="promo-note">{promo.note}</div>
                    <div className="promo-left">Số lượng còn lại: {promo.left}</div>
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
                <div className="no-promo-found">
                  Không tìm thấy mã phù hợp
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nút đặt xe và điều khoản */}
      <div className="booking-actions">
        {/* Checkbox xác nhận */}
        <div className="confirm-checkbox-row">
          <input
            type="checkbox"
            id="confirm-booking-checkbox"
            checked={confirmChecked}
            onChange={e => setConfirmChecked(e.target.checked)}
          />
          <label htmlFor="confirm-booking-checkbox" style={{marginLeft: 8}}>
            Tôi xác nhận thông tin đặt xe là chính xác và đồng ý với các điều khoản.
          </label>
        </div>
        <button
          className="book-now-button"
          onClick={handleSubmit}
          disabled={!selectedDates.startDate || !selectedDates.endDate || (pickupLocation !== vehicle.location && !pickupLocation) || isSubmitting || !confirmChecked}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đặt xe ngay'}
        </button>
        <div className="terms-agreement">
          <p className="booking-section__note">
            Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với{' '}
            <a href="/terms">khoản sử dụng</a> và <a href="/policy">Chính sách bảo mật</a> của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleBookingSection; 