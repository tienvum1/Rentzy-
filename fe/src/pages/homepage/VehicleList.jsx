import React, { useState, useEffect } from 'react';
import VehicleCard from '../../components/VehicleCard/VehicleCard';
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
          vehicle={v} // Pass the entire vehicle object
        />
      ))}
    </div>
    </div>
  );
};

export default VehicleList; 