import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import { FaArrowLeft, FaTruck, FaHandshake, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaMoneyBillWave, FaCar, FaCheck, FaCamera, FaTimes } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import SidebarOwner from '../../components/SidebarOwner/SidebarOwner';
import './BookingDetailOwner.css';

// Set moment locale to Vietnamese
moment.locale('vi');

const BookingDetailOwner = () => {
  const { id } = useParams();
  console.log("idd" , id);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/owner/getBookingById/${id}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setBooking(response.data.booking);
        setError(null);
      } else {
        setError(response.data.message || 'Không thể tải thông tin đơn đặt xe');
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin đơn đặt xe');
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để xem chi tiết đơn đặt xe.");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setDeliveryImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setDeliveryImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDeliverVehicle = async () => {
    if (deliveryImages.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một ảnh xe trước khi giao');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload images first
      const formData = new FormData();
      deliveryImages.forEach((image, index) => {
        formData.append('images', image.file);
      });

      const uploadResponse = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/upload/delivery-images/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      if (!uploadResponse.data.success) {
        throw new Error('Không thể tải lên ảnh');
      }

      // Then update delivery status
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}/deliver`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Đã cập nhật trạng thái giao xe');
        setDeliveryImages([]);
        fetchBookingDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái giao xe');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCollectVehicle = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}/collect`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Đã cập nhật trạng thái nhận xe');
        fetchBookingDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái nhận xe');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (date) => {
    return moment.utc(date).local().format('DD/MM/YYYY HH:mm');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ xử lý';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'DEPOSIT_PAID':
        return 'Đã thanh toán tiền giữ chỗ';
      case 'RENTAL_PAID':
        return 'Đã thanh toán đầy đủ';
      case 'IN_PROGRESS':
        return 'Đang sử dụng';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELED':
        return 'Đã hủy';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'EXPIRED':
        return 'Đã hết hạn';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="booking-detail-container">
          <SidebarOwner />
          <div className="loading-message">Đang tải thông tin đơn đặt xe...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="booking-detail-container">
          <SidebarOwner />
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header />
        <div className="booking-detail-container">
          <SidebarOwner />
          <div className="error-message">Không tìm thấy thông tin đơn đặt xe</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="booking-detail-container">
        <SidebarOwner />
        <div className="booking-detail-content">
          <div className="booking-detail-header">
            <div className="header-left">
              <button className="back-button" onClick={() => navigate('/ownerpage/booking-management')}>
                <FaArrowLeft /> Quay lại danh sách
              </button>
              <div className="booking-id">
                <span className="id-label">Mã đơn:</span>
                <span className="id-value">{booking._id}</span>
              </div>
            </div>
            
            <div className="header-center">
              <h2>Chi tiết đơn đặt xe</h2>
              <div className="booking-dates">
                <span className="date-item">
                  <FaCalendarAlt /> Tạo lúc: {formatDateTime(booking.createdAt)}
                </span>
                <span className="date-item">
                  <FaCalendarAlt /> Cập nhật: {formatDateTime(booking.updatedAt)}
                </span>
              </div>
            </div>

            <div className="header-right">
              <div className="booking-status">
                <span className={`status-badge ${getStatusClass(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              <div className="booking-actions">
                {booking.status === 'RENTAL_PAID' && booking.deliveryStatus === 'PENDING' && (
                  <div className="delivery-confirmation">
                    <h4>Xác nhận giao xe</h4>
                    <p>Vui lòng tải lên ảnh xe trước khi giao và xác nhận khi bạn đã giao xe cho khách hàng.</p>
                    
                    <div className="image-upload-section">
                      <div className="image-preview-grid">
                        {deliveryImages.map((image, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={image.preview} alt={`Ảnh xe ${index + 1}`} />
                            <button 
                              className="remove-image-btn"
                              onClick={() => removeImage(index)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                        {deliveryImages.length < 5 && (
                          <label className="upload-button">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                            <FaCamera />
                            <span>Tải ảnh lên</span>
                          </label>
                        )}
                      </div>
                      <p className="upload-hint">Tải lên tối đa 5 ảnh xe trước khi giao</p>
                    </div>

                    <button 
                      className="deliver-button"
                      onClick={handleDeliverVehicle}
                      disabled={isUploading || deliveryImages.length === 0}
                    >
                      {isUploading ? (
                        'Đang xử lý...'
                      ) : (
                        <>
                          <FaTruck /> Xác nhận đã giao xe
                        </>
                      )}
                    </button>
                  </div>
                )}
                {booking.status === 'IN_PROGRESS' && booking.returnStatus === 'RETURNED' && (
                  <div className="delivery-confirmation">
                    <h4>Xác nhận nhận xe</h4>
                    <p>Vui lòng xác nhận khi bạn đã nhận lại xe từ khách hàng. Hành động này sẽ hoàn tất đơn đặt xe.</p>
                    <button 
                      className="deliver-button"
                      onClick={handleCollectVehicle}
                    >
                      <FaHandshake /> Xác nhận đã nhận xe
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="booking-detail-grid">
            {/* Thông tin xe */}
            <div className="detail-section">
              <h3>
                <FaCar /> Thông tin xe
              </h3>
              <div className="detail-content">
                <p><strong>Tên xe:</strong> {booking.vehicle?.name}</p>
                <p><strong>Thương hiệu:</strong> {booking.vehicle?.brand}</p>
                <p><strong>Model:</strong> {booking.vehicle?.model}</p>
                <p><strong>Năm sản xuất:</strong> {booking.vehicle?.year}</p>
                <p><strong>Biển số xe:</strong> {booking.vehicle?.licensePlate}</p>
                
                {booking.status === 'pending' && !booking.isDelivered && (
                  <div className="delivery-confirmation">
                    <button 
                      className="deliver-button"
                      onClick={handleDeliverVehicle}
                    >
                      <FaCheck /> Xác nhận giao xe
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin người thuê */}
            <div className="detail-section">
              <h3>
                <FaUser /> Thông tin người thuê
              </h3>
              <div className="detail-content">
                <p><strong>Họ và tên:</strong> {booking.renter?.fullName}</p>
                <p><strong>Email:</strong> {booking.renter?.email}</p>
                <p><strong>Số điện thoại:</strong> {booking.renter?.phone}</p>
                
                <div className="driver-license-section">
                  <h4>Thông tin giấy phép lái xe</h4>
                  <div className="driver-license-info">
                    <p><strong>Họ và tên:</strong> {booking.renter?.driver_license_full_name}</p>
                    <p><strong>Số giấy phép:</strong> {booking.renter?.driver_license_number}</p>
                    <p><strong>Ngày sinh:</strong> {moment(booking.renter?.driver_license_birth_date).format('DD/MM/YYYY')}</p>
                  </div>
                  {booking.renter?.driver_license_front_url && (
                    <div className="driver-license-image">
                      <h5>Ảnh giấy phép lái xe</h5>
                      <img 
                        src={booking.renter.driver_license_front_url} 
                        alt="Giấy phép lái xe" 
                        className="license-image"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin đặt xe */}
            <div className="detail-card">
              <h3><FaCalendarAlt /> Thông tin đặt xe</h3>
              <div className="detail-content">
                <p><strong>Ngày nhận:</strong> {formatDateTime(booking.startDate)}</p>
                <p><strong>Ngày trả:</strong> {formatDateTime(booking.endDate)}</p>
                <p><strong>Số ngày thuê:</strong> {booking.totalDays}</p>
                <p><strong>Ghi chú:</strong> {booking.note || 'Không có ghi chú'}</p>
              </div>
            </div>

            {/* Địa điểm */}
            <div className="detail-section">
              <h3>
                <FaMapMarkerAlt /> Thông tin địa điểm
              </h3>
              <div className="detail-content">
                <div className="location-section">
                  <h4>Địa điểm nhận xe</h4>
                  <p>
                    <strong>Địa chỉ:</strong> {booking.pickupTime?.pickupLocation || 'Chưa có thông tin'}
                  </p>
                  <p>
                    <strong>Thời gian:</strong> {booking.pickupTime?.actualPickupTime 
                      ? formatDateTime(booking.pickupTime.actualPickupTime) 
                      : 'Chưa có thông tin'}
                  </p>
                  {booking.pickupTime?.pickupNote && (
                    <p><strong>Ghi chú:</strong> {booking.pickupTime.pickupNote}</p>
                  )}
                  {booking.pickupTime?.pickupImages && booking.pickupTime.pickupImages.length > 0 && (
                    <div className="location-images">
                      <h5>Hình ảnh địa điểm nhận xe</h5>
                      <div className="image-grid">
                        {booking.pickupTime.pickupImages.map((image, index) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`Địa điểm nhận xe ${index + 1}`}
                            className="location-image"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="location-section">
                  <h4>Địa điểm trả xe</h4>
                  <p>
                    <strong>Địa chỉ:</strong> {booking.returnTime?.returnLocation || 'Chưa có thông tin'}
                  </p>
                  <p>
                    <strong>Thời gian:</strong> {booking.returnTime?.actualReturnTime 
                      ? formatDateTime(booking.returnTime.actualReturnTime) 
                      : 'Chưa có thông tin'}
                  </p>
                  {booking.returnTime?.returnNote && (
                    <p><strong>Ghi chú:</strong> {booking.returnTime.returnNote}</p>
                  )}
                  {booking.returnTime?.returnImages && booking.returnTime.returnImages.length > 0 && (
                    <div className="location-images">
                      <h5>Hình ảnh địa điểm trả xe</h5>
                      <div className="image-grid">
                        {booking.returnTime.returnImages.map((image, index) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`Địa điểm trả xe ${index + 1}`}
                            className="location-image"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {booking.deliveryTime && (
                  <div className="location-section">
                    <h4>Địa điểm giao xe</h4>
                    <p>
                      <strong>Địa chỉ:</strong> {booking.deliveryTime.deliveryLocation || 'Chưa có thông tin'}
                    </p>
                    <p>
                      <strong>Thời gian:</strong> {booking.deliveryTime.actualDeliveryTime 
                        ? formatDateTime(booking.deliveryTime.actualDeliveryTime) 
                        : 'Chưa có thông tin'}
                    </p>
                    {booking.deliveryTime.deliveryNote && (
                      <p><strong>Ghi chú:</strong> {booking.deliveryTime.deliveryNote}</p>
                    )}
                    {booking.deliveryTime.deliveryImages && booking.deliveryTime.deliveryImages.length > 0 && (
                      <div className="location-images">
                        <h5>Hình ảnh địa điểm giao xe</h5>
                        <div className="image-grid">
                          {booking.deliveryTime.deliveryImages.map((image, index) => (
                            <img 
                              key={index}
                              src={image} 
                              alt={`Địa điểm giao xe ${index + 1}`}
                              className="location-image"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {booking.collectionTime && (
                  <div className="location-section">
                    <h4>Địa điểm nhận lại xe</h4>
                    <p>
                      <strong>Địa chỉ:</strong> {booking.collectionTime.collectionLocation || 'Chưa có thông tin'}
                    </p>
                    <p>
                      <strong>Thời gian:</strong> {booking.collectionTime.actualCollectionTime 
                        ? formatDateTime(booking.collectionTime.actualCollectionTime) 
                        : 'Chưa có thông tin'}
                    </p>
                    {booking.collectionTime.collectionNote && (
                      <p><strong>Ghi chú:</strong> {booking.collectionTime.collectionNote}</p>
                    )}
                    {booking.collectionTime.collectionImages && booking.collectionTime.collectionImages.length > 0 && (
                      <div className="location-images">
                        <h5>Hình ảnh địa điểm nhận lại xe</h5>
                        <div className="image-grid">
                          {booking.collectionTime.collectionImages.map((image, index) => (
                            <img 
                              key={index}
                              src={image} 
                              alt={`Địa điểm nhận lại xe ${index + 1}`}
                              className="location-image"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin thanh toán */}
            <div className="detail-card">
              <h3><FaMoneyBillWave /> Thông tin thanh toán</h3>
              <div className="detail-content">
                <p><strong>Tổng tiền:</strong> {formatCurrency(booking.totalAmount)}</p>
                <p><strong>Tiền thuê xe:</strong> {formatCurrency(booking.totalCost)}</p>
                <p><strong>Tiền cọc:</strong> {formatCurrency(booking.deposit)}</p>
                <p><strong>Phí đặt xe:</strong> {formatCurrency(booking.reservationFee)}</p>
                <p><strong>Phí giao xe:</strong> {formatCurrency(booking.deliveryFee)}</p>
                <p><strong>Giảm giá:</strong> {formatCurrency(booking.discountAmount)}</p>
                {booking.promoCode && (
                  <p><strong>Mã giảm giá:</strong> {booking.promoCode}</p>
                )}
              </div>
            </div>

            {/* Giao dịch */}
            <div className="detail-card">
              <h3>Lịch sử giao dịch</h3>
              <div className="detail-content">
                {booking.transactions?.map((transaction, index) => (
                  <div key={transaction._id} className="transaction-item">
                    <h4>Giao dịch {index + 1}</h4>
                    <p><strong>Số tiền:</strong> {formatCurrency(transaction.amount)}</p>
                    <p><strong>Trạng thái:</strong> {transaction.status}</p>
                    <p><strong>Phương thức:</strong> {transaction.paymentMethod}</p>
                    <p><strong>Thời gian:</strong> {formatDateTime(transaction.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingDetailOwner; 