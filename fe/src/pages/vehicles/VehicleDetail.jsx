import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './VehicleDetail.css'; // Import the CSS file
import VehicleHeader from '../../components/VehicleDetailSections/VehicleHeader';
import VehicleImageGallery from '../../components/VehicleDetailSections/VehicleImageGallery';
import VehicleFeatures from '../../components/VehicleDetailSections/VehicleFeatures';
import VehicleDescription from '../../components/VehicleDetailSections/VehicleDescription';
import VehicleAmenities from '../../components/VehicleDetailSections/VehicleAmenities';
import VehicleTerms from '../../components/VehicleDetailSections/VehicleTerms';
import CancellationPolicy from '../../components/VehicleDetailSections/CancellationPolicy';
import VehiclePricingOptions from '../../components/VehicleDetailSections/VehiclePricingOptions';
import VehicleRentalTime from '../../components/VehicleDetailSections/VehicleRentalTime';
import VehiclePickupDelivery from '../../components/VehicleDetailSections/VehiclePickupDelivery';
import VehicleCostSummary from '../../components/VehicleDetailSections/VehicleCostSummary';
import VehicleOtherCosts from '../../components/VehicleDetailSections/VehicleOtherCosts';
import VehicleBookingButton from '../../components/VehicleDetailSections/VehicleBookingButton';
import VehicleOwnerInfo from '../../components/VehicleDetailSections/VehicleOwnerInfo';

const VehicleDetail = () => {
    const { id } = useParams(); // Get the ID from the URL
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null); // State to hold the currently selected image for display

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

    useEffect(() => {
        const fetchVehicleDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${backendUrl}/api/cars/${id}`); // Assuming /api/cars/:id endpoint
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

    if (loading) {
        return <div>Đang tải thông tin xe...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Lỗi: {error}</div>;
    }

    if (!vehicle) {
        return <div>Không tìm thấy thông tin xe.</div>;
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
                    <VehicleTerms terms={vehicle.termsAndConditions} />
                    <CancellationPolicy />
                    <VehicleOwnerInfo />
                </div>
                <div className="vehicle-detail-right-column">
                    <VehiclePricingOptions />
                    <VehicleRentalTime />
                    <VehiclePickupDelivery vehicleLocation={vehicle.location} />
                    <VehicleCostSummary 
                        rentalFee={2887500} 
                        discountAmount={462000} 
                        vat={231000} 
                        totalRentalFee={2656500} 
                        depositAmount={500000} 
                    />
                    <VehicleBookingButton />
                    <VehicleOtherCosts />
                </div>
            </div>
        </div>
    );
};

export default VehicleDetail; 