import React, { useEffect, useState } from "react";
import axios from "axios";
import VehicleCard from "../../components/VehicleCard/vehicleCard";
import "./VehicleListPage.css";
import SearchBar from "../../components/vehicleFilter/SearchBar";
import FilterBar from "../../components/vehicleFilter/FilterBar";
import Header from "../../components/Header/Header";
import Footer from "../../components/footer/Footer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4999";

const VehicleListPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/vehicles/approved`);
        setVehicles(Array.isArray(res.data.vehicles) ? res.data.vehicles : []);
      } catch (err) {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleSearch = (params) => {
    // Xử lý tìm kiếm
  };
  const handleSort = () => {
    // Xử lý sắp xếp
  };

  return (
    <div className="vehicle-list-page-container">
      <Header />
      <h2 className="vehicle-list-title">Danh sách xe đã được duyệt</h2>
      <SearchBar onSearch={handleSearch} />
      <FilterBar onSort={handleSort} />
      {loading ? (
        <div className="vehicle-list-loading">Đang tải danh sách xe...</div>
      ) : Array.isArray(vehicles) && vehicles.length > 0 ? (
        <div className="vehicle-list-grid">
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="vehicle-list-empty">Không có xe nào được duyệt.</div>
      )}
      <Footer />
    </div>
  );
};

export default VehicleListPage;