import React, { useEffect, useState } from "react";
import axios from "axios";
import VehicleCard from "../../components/vehicleCard/VehicleCard";
import "./VehicleListPage.css";
import SearchBar from "../../components/vehicleFilter/SearchBar";
import FilterBar from "../../components/vehicleFilter/FilterBar";
import Header from "../../components/Header/Header";
import Footer from "../../components/footer/Footer";
import { searchVehiclesByTime } from '../../services/vehicleService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4999";

const VehicleListPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Fetch all vehicles (tất cả)
  const fetchAllVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/vehicles/approved`);
      setVehicles(Array.isArray(res.data.vehicles) ? res.data.vehicles : []);
    } catch (err) {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered vehicles
  const fetchFilteredVehicles = async (newFilters) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (newFilters.seat) query.append('seat', newFilters.seat);
      if (newFilters.brand) query.append('brand', newFilters.brand);
      if (newFilters.transmission) query.append('transmission', newFilters.transmission);
      if (newFilters.fuel) query.append('fuel', newFilters.fuel);
      if (newFilters.area) query.append('area', newFilters.area);
      // Nếu không có filter nào thì fetch all
      if ([...query.keys()].length === 0) {
        fetchAllVehicles();
        return;
      }
      const url = `${BACKEND_URL}/api/vehicles/approved?${query.toString()}`;
      const res = await axios.get(url);
      setVehicles(Array.isArray(res.data.vehicles) ? res.data.vehicles : []);
    } catch (err) {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Khi mount, fetch all vehicles
  useEffect(() => {
    fetchAllVehicles();
  }, []);

  // Khi filter thay đổi, fetch đúng API
  useEffect(() => {
    const allNull = Object.values(filters).every(v => !v);
    if (allNull) {
      fetchAllVehicles();
    } else {
      fetchFilteredVehicles(filters);
    }
  }, [filters]);

  // Handler khi filter thay đổi
  const handleFilter = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleSearch = async (params) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.pickupDate) query.append('pickupDate', params.pickupDate);
      if (params.pickupTime) query.append('pickupTime', params.pickupTime);
      if (params.returnDate) query.append('returnDate', params.returnDate);
      if (params.returnTime) query.append('returnTime', params.returnTime);
      const url = `${BACKEND_URL}/api/vehicles/approved?${query.toString()}`;
      const res = await axios.get(url);
      setVehicles(Array.isArray(res.data.vehicles) ? res.data.vehicles : []);
    } catch (err) {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSort = () => {
    // Xử lý sắp xếp
  };

  const handleClearAllFilters = () => {
    setFilters({});
    fetchAllVehicles();
  };

  return (
    <div className="vehicle-list-page-container">
      <Header />
      <h2 className="vehicle-list-title">Danh sách xe đã được duyệt</h2>
      <SearchBar onSearch={handleSearch} />
      <FilterBar onFilter={handleFilter} onClearAllFilters={handleClearAllFilters} onSort={handleSort} />
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