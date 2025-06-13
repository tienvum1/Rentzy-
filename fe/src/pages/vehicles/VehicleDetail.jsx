import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleDetail.css';
import VehicleHeader from '../../components/VehicleDetailSections/VehicleHeader';
import VehicleImageGallery from '../../components/VehicleDetailSections/VehicleImageGallery';
import VehicleFeatures from '../../components/VehicleDetailSections/VehicleFeatures';
import VehicleDescription from '../../components/VehicleDetailSections/VehicleDescription';
import VehicleAmenities from '../../components/VehicleDetailSections/VehicleAmenities';
import VehicleTerms from '../../components/VehicleDetailSections/VehicleTerms';
import VehicleOwnerInfo from '../../components/VehicleDetailSections/VehicleOwnerInfo';
import VehicleBookingSection from '../../components/VehicleDetailSections/VehicleBookingSection';

const VehicleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

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

    const handleBookNow = async (bookingData) => {
        try {
            // Kiểm tra đăng nhập
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login', { state: { from: `/vehicles/${id}` } });
                return;
            }

            // Tạo booking mới
            const response = await axios.post(
                `${backendUrl}/api/bookings`,
                {
                    vehicleId: id,
                    startDate: bookingData.startDate,
                    endDate: bookingData.endDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Chuyển hướng đến trang thanh toán
            navigate(`/payment/${response.data.booking._id}`);
        } catch (err) {
            console.error('Error creating booking:', err);
            alert(err.response?.data?.message || 'Failed to create booking. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin xe...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Lỗi</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/vehicles')}>Quay lại danh sách xe</button>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="not-found-container">
                <h2>Không tìm thấy thông tin xe</h2>
                <p>Xe bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                <button onClick={() => navigate('/vehicles')}>Quay lại danh sách xe</button>
            </div>
        );
    }

    return (
        <div className="vehicle-detail-page">
            <div className="vehicle-detail-content-wrapper">
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
                <div className="vehicle-detail-right-column">
                    <VehicleBookingSection 
                        vehicle={vehicle}
                        onBookNow={handleBookNow}
                    />
                </div>
            </div>
        </div>
    );
};

export default VehicleDetail; 