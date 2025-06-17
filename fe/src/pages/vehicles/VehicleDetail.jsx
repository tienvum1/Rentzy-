// fe/src/pages/vehicles/VehicleDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './VehicleDetail.css';
import Header from '../../components/Header/Header';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import các components
import VehicleHeader from '../../components/VehicleDetailSections/VehicleHeader';
import VehicleImageGallery from '../../components/VehicleDetailSections/VehicleImageGallery';
import VehicleFeatures from '../../components/VehicleDetailSections/VehicleFeatures';
import VehicleDescription from '../../components/VehicleDetailSections/VehicleDescription';
import VehicleAmenities from '../../components/VehicleDetailSections/VehicleAmenities';
import VehicleTerms from '../../components/VehicleDetailSections/VehicleTerms';
import VehicleOwnerInfo from '../../components/VehicleDetailSections/VehicleOwnerInfo';
import VehicleBookingSection from '../../components/VehicleDetailSections/VehicleBookingSection';
import DateTimeSelector from '../../components/DateTimeSelector/DateTimeSelector';

const VehicleDetail = () => {
    // Hooks
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useAuth();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

    // States
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [bookedDates, setBookedDates] = useState([]);
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);
    const [selectedDates, setSelectedDates] = useState({ startDate: null, endDate: null });
    const [pickupTime, setPickupTime] = useState('');
    const [returnTime, setReturnTime] = useState('');

    // Fetch vehicle details
    useEffect(() => {
        const fetchVehicleDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${backendUrl}/api/cars/${id}`);
                setVehicle(response.data.vehicle);
                setSelectedImage(response.data.vehicle.primaryImage);
            } catch (err) {
                console.error('Error fetching vehicle details:', err);
                setError(err.response?.data?.message || 'Failed to fetch vehicle details.');
            }
            setLoading(false);
        };

        if (id) {
            fetchVehicleDetails();
        }
    }, [id]);

    useEffect(() => {
        const fetchBookedDates = async () => {
            // Only fetch booked dates if vehicle data is available
            if (!vehicle || !vehicle._id) {
                return;
            }
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/vehicle/${vehicle._id}/dates`);
                setBookedDates(response.data.bookedDates);
            } catch (error) {
                toast.error('Lỗi khi lấy thông tin lịch đặt xe.');
            } finally {
                setLoading(false);
            }
        };

        // Call fetchBookedDates only if vehicle is not null
        if (vehicle) {
            fetchBookedDates();
        }
    }, [vehicle]); // Add vehicle to the dependency array

    // Hàm xử lý sau khi đặt xe thành công từ VehicleBookingSection
    const handleBookingSuccess = (bookingId, transactionId, amount) => {
        toast.success('Đặt xe thành công! Đang chuyển đến trang thanh toán...', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });

        // Chuyển hướng trực tiếp đến trang thanh toán
        navigate(`/confirm/${bookingId}`);
    };

    const handleDateTimeSelect = (newDates) => {
        if (newDates) {
            // Store the dates and times as received from DateTimeSelector
            setSelectedDates({
                startDate: newDates.startDate,
                endDate: newDates.endDate
            });
            setPickupTime(newDates.pickupTime);
            setReturnTime(newDates.returnTime);
        }
        setShowDateTimeModal(false);
    };

    // Add a function to format dates for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin xe...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="error-container">
                <h2>Lỗi</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/vehicles')}>Quay lại danh sách xe</button>
            </div>
        );
    }

    // Not found state
    if (!vehicle) {
        return (
            <div className="not-found-container">
                <h2>Không tìm thấy thông tin xe</h2>
                <p>Xe bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                <button onClick={() => navigate('/vehicles')}>Quay lại danh sách xe</button>
            </div>
        );
    }

    // Main render
    return (
        <div className="vehicle-detail">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <Header />
            <div className="vehicle-detail-page">
                <div className="vehicle-detail-content-wrapper">
                    {/* Left column - Vehicle information */}
                    <div className="vehicle-detail-left-column">
                        <VehicleImageGallery 
                            primaryImage={vehicle.primaryImage} 
                            gallery={vehicle.gallery} 
                            selectedImage={selectedImage} 
                            setSelectedImage={setSelectedImage}
                            brand={vehicle.brand}
                            model={vehicle.model}
                        />
                        <VehicleHeader 
                            model={vehicle.model} 
                            location={vehicle.location} 
                            isAvailable247={vehicle.isAvailable247} 
                        />
                        <VehicleFeatures 
                            seatCount={vehicle.seatCount} 
                            transmission={vehicle.transmission} 
                            fuelType={vehicle.fuelType} 
                            fuelConsumption={vehicle.fuelConsumption}
                        />
                        <VehicleDescription description={vehicle.description} />
                        <VehicleAmenities features={vehicle.features} />
                        <VehicleTerms terms={vehicle.rentalPolicy} />
                        <VehicleOwnerInfo 
                            owner={vehicle.owner}
                            rating={vehicle.ownerRating}
                            responseTime={vehicle.ownerResponseTime}
                        />
                    </div>

                    {/* Right column - Booking section */}
                    <div className="vehicle-detail-right-column">
                        <VehicleBookingSection 
                            vehicle={vehicle}
                            onBookNow={handleBookingSuccess}
                            isAuthenticated={isAuthenticated}
                            user={user}
                            bookedDates={bookedDates}
                        />
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetail;