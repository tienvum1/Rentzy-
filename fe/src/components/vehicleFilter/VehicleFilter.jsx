import React, { useState } from "react";
import "./VehicleFilter.css";

// Dữ liệu giả lập danh sách xe
const vehicles = [
  {
    id: 1,
    brand: "Toyota",
    model: "Camry",
    seatCount: 5,
    bodyType: "Sedan",
    transmission: "automatic",
    fuelType: "gasoline",
    location: "Hà Nội",
    pricePerDay: 900000,
    deposit: 2000000,
    features: ["Bluetooth", "Camera lùi"],
    status: "available",
  },
  {
    id: 2,
    brand: "Honda",
    model: "Civic",
    seatCount: 5,
    bodyType: "Sedan",
    transmission: "manual",
    fuelType: "gasoline",
    location: "TP. HCM",
    pricePerDay: 800000,
    deposit: 1500000,
    features: ["Điều hoà", "Bluetooth"],
    status: "available",
  },
  {
    id: 3,
    brand: "VinFast",
    model: "Lux A2.0",
    seatCount: 5,
    bodyType: "Sedan",
    transmission: "automatic",
    fuelType: "gasoline",
    location: "Hà Nội",
    pricePerDay: 1000000,
    deposit: 2500000,
    features: ["Camera lùi", "Bluetooth"],
    status: "rented",
  },
  {
    id: 4,
    brand: "Ford",
    model: "Ranger",
    seatCount: 5,
    bodyType: "Pickup",
    transmission: "automatic",
    fuelType: "diesel",
    location: "Đà Nẵng",
    pricePerDay: 1200000,
    deposit: 3000000,
    features: ["Bluetooth", "Camera lùi"],
    status: "available",
  },
  // ... thêm xe khác nếu muốn
];

const brandOptions = [
  "Toyota",
  "Kia",
  "Mazda",
  "Hyundai",
  "Honda",
  "VinFast",
  "Ford",
  "Mercedes-Benz"
];
const bodyTypeOptions = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Pickup'
];
const transmissionOptions = [
  { value: '', label: 'Hộp số' },
  { value: 'manual', label: 'Số sàn' },
  { value: 'automatic', label: 'Tự động' },
];
const fuelTypeOptions = [
  { value: '', label: 'Nhiên liệu' },
  { value: 'gasoline', label: 'Xăng' },
  { value: 'diesel', label: 'Dầu' },
  { value: 'electric', label: 'Điện' },
  { value: 'hybrid', label: 'Hybrid' },
];
// const statusOptions = [ ... ]; // Đã bỏ

const unique = (arr) => [...new Set(arr)].filter(Boolean);

const VehicleFilter = () => {
  // State cho từng trường lọc
  const [brand, setBrand] = useState("");
  // const [model, setModel] = useState(""); // Đã bỏ
  const [seatCount, setSeatCount] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  // const [location, setLocation] = useState(""); // Đã bỏ
  // const [status, setStatus] = useState(""); // Đã bỏ
  const [filtered, setFiltered] = useState(vehicles);

  // Lấy option unique từ danh sách xe
  // const modelOptions = unique(vehicles.map(v => v.model)); // Đã bỏ
  const seatCountOptions = unique(vehicles.map(v => v.seatCount)).sort((a, b) => a - b);
  const bodyTypeDropdown = unique([...vehicles.map(v => v.bodyType), ...bodyTypeOptions]);

  // Lọc khi bấm tìm kiếm
  const handleFilter = (e) => {
    e.preventDefault();
    let result = vehicles.filter((v) => {
      return (
        (!brand || v.brand === brand) &&
        // (!model || v.model === model) && // Đã bỏ
        (!seatCount || v.seatCount === Number(seatCount)) &&
        (!bodyType || v.bodyType === bodyType) &&
        (!transmission || v.transmission === transmission) &&
        (!fuelType || v.fuelType === fuelType)
        // (!location || v.location === location) && // Đã bỏ
        // (!status || v.status === status) // Đã bỏ
      );
    });
    setFiltered(result);
  };

  return (
    <div className="vehicle-filter-container">
      <h2 className="vehicle-filter-title">Lọc xe</h2>
      <form onSubmit={handleFilter} className="vehicle-filter-form">
        <select value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">Thương hiệu</option>
          {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {/* Đã bỏ filter dòng xe */}
        <select value={seatCount} onChange={e => setSeatCount(e.target.value)}>
          <option value="">Số chỗ</option>
          {seatCountOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={bodyType} onChange={e => setBodyType(e.target.value)}>
          <option value="">Dạng thân xe</option>
          {bodyTypeDropdown.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={transmission} onChange={e => setTransmission(e.target.value)}>
          {transmissionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={fuelType} onChange={e => setFuelType(e.target.value)}>
          {fuelTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {/* Đã bỏ filter địa chỉ và trạng thái */}
        <button type="submit">Tìm kiếm</button>
      </form>
      <div className="vehicle-filter-results">
        <h3>Kết quả:</h3>
        {filtered.length === 0 ? (
          <p>Không tìm thấy xe phù hợp.</p>
        ) : (
          <ul>
            {filtered.map(v => (
              <li key={v.id}>
                <b>{v.brand} {v.model}</b> - {v.seatCount} chỗ - {v.bodyType} - {v.transmission} - {v.fuelType} - {v.location} - {v.pricePerDay.toLocaleString()}đ/ngày - Trạng thái: {v.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VehicleFilter; 