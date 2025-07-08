import React, { useState, useEffect } from "react";
import VehicleCard from "../../components/VehicleCard/VehicleCard.jsx";
import "./VehicleList.css";
import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4999";

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filter, setFilter] = useState({
    brand: "",
    model: "",
    location: "",
    seatCount: "",
    fuelType: "",
    transmission: "",
    startDate: "",
    endDate: "",
  });

  // Các options cho filter (có thể lấy từ API hoặc hardcode)
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [seatCounts, setSeatCounts] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);

  // Fetch filter options (có thể tối ưu sau)
  useEffect(() => {
    // ...fetch brands, models, locations, seatCounts, fuelTypes, transmissions như cũ...
  }, []);

  // fetching each time filter changes
  useEffect(() => {
    const fetchApprovedVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gọi đúng endpoint RESTful, truyền filter qua query params
        const response = await axios.get(`${backendUrl}/api/vehicles/approved`, {
          params: {
            brand: filter.brand,
            model: filter.model,
            location: filter.location,
            seatCount: filter.seatCount,
            fuelType: filter.fuelType,
            transmission: filter.transmission,
            startDate: filter.startDate,
            endDate: filter.endDate,
          },
        });
        setVehicles(response.data.vehicles);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải danh sách xe.");
      }
      setLoading(false);
    };
    fetchApprovedVehicles();
  }, [filter]);

  // Render UI
  if (loading) return <div className="vehicle-list-container">Đang tải danh sách xe...</div>;
  if (error) return <div className="vehicle-list-container" style={{ color: "red" }}>Lỗi: {error}</div>;

  return (
    <div className="vehicle-list-container">
      <h1>Danh sách Xe có thể thuê</h1>
      {/* Filter UI */}
      {/* ...giữ nguyên phần filter như cũ, chỉ cần đảm bảo setFilter đúng... */}
      {vehicles.length === 0 ? (
        <div className="no-vehicles-message">Không có xe nào phù hợp với bộ lọc của bạn.</div>
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
