import React, { useState, useEffect } from "react";
import VehicleCard from "../../components/VehicleCard/VehicleCard.jsx";
import "./VehicleList.css";
import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4999";

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/vehicles/approved`);
        setVehicles(response.data.vehicles);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải danh sách xe.");
      }
      setLoading(false);
    };
    fetchApprovedVehicles();
  }, []);

  if (loading) return <div className="vehicle-list-container">Đang tải danh sách xe...</div>;
  if (error) return <div className="vehicle-list-container" style={{ color: "red" }}>Lỗi: {error}</div>;

  return (
    <div className="vehicle-list-container">
      <h1>Danh sách Xe có thể thuê</h1>
      {vehicles.length === 0 ? (
        <div className="no-vehicles-message">Không có xe nào phù hợp.</div>
      ) : (
        <div className="vehicle-list">
          {vehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
