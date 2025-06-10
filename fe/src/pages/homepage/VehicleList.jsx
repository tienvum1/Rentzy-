import React, { useState, useEffect } from 'react';
import VehicleCard from '../../components/VehicleCard/vehicleCard.jsx';
import './VehicleList.css';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';

// Remove hardcoded vehicles array
// const vehicles = [ ... ];

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/cars/approved`, {
             withCredentials: true, // Include cookies
        });
        console.log('Fetched approved vehicles:', response.data.vehicles);
        setVehicles(response.data.vehicles);
      } catch (err) {
        console.error('Error fetching approved vehicles:', err);
         // Display error message from backend if available
        setError(err.response?.data?.message || 'Không thể tải danh sách xe.');
      }
      setLoading(false);
    };

    fetchApprovedVehicles();
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Render loading, error, or the list
  if (loading) {
    return <div className="vehicle-list-container">Đang tải danh sách xe...</div>;
  }

  if (error) {
    return <div className="vehicle-list-container" style={{ color: 'red' }}>Lỗi: {error}</div>;
  }

  if (vehicles.length === 0) {
      return <div className="vehicle-list-container">Không có xe nào để hiển thị.</div>;
  }

  return (
    <div  className='vehicle-list-container'>
     <h1>Danh sách Xe có thể thuê</h1>
    <div className="vehicle-list">

      {vehicles.map((v) => (
          // Map backend vehicle object to VehicleCard props
        <VehicleCard
          key={v._id} // Use unique vehicle ID as key
          image={v.primaryImage || 'https://via.placeholder.com/300x200?text=No+Image'} // Use primaryImage, fallback to placeholder
          name={`${v.brand} ${v.model}`} // Combine brand and model for name
          // Assuming year is not directly available in schema, omit or add placeholder
          // year={v.year || 'N/A'}
          seats={v.type === 'car' ? v.specificDetails?.seatCount : 'N/A'} // Get seats if car
          transmission={v.type === 'car' ? (v.specificDetails?.transmission === 'automatic' ? 'Số tự động' : (v.specificDetails?.transmission === 'manual' ? 'Số sàn' : 'N/A')) : 'N/A'} // Map transmission if car
          fuel={v.type === 'car' ? (v.specificDetails?.fuelType || 'N/A') : 'N/A'} // Map fuel if car
          pricePerDay={`${v.pricePerDay ? parseFloat(v.pricePerDay).toLocaleString() : 'N/A'} VNĐ`} // Format price
          location={v.location || 'N/A'}
          // isSaved prop would need a mechanism to track saved status (e.g., user saved list)
          // isSaved={false}
          onSave={() => {console.log('Save clicked for', v._id)}} // Placeholder save action
          onViewDetails={() => {console.log('View details clicked for', v._id)}} // Placeholder view details action
        />
      ))}
    </div>
    </div>
  );
};

export default VehicleList; 