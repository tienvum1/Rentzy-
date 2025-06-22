import React, { useState, useEffect } from "react";
import VehicleCard from "../../components/VehicleCard/VehicleCard.jsx";
import "./VehicleList.css";
import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4999";

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch value for each filter :
  const [brands, setBrands] = useState("");
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [seatCounts, setSeatCounts] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  //  Filter state
  const [filter, setFilter] = useState({
    model: "",
    brand: "",
    location: "",
    seatCount: "",
    fuelType: "",
    transmission: "",
    startDate: "",
    endDate: "",
  });
  console.log("Initial filter state:", filter);
  // fetching each time filter changes
  useEffect(() => {
    const fetchApprovedVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${backendUrl}/api/cars/approved`, {
          brand: filter.brand,
          model: filter.model,
          location: filter.location,
          seatCount: filter.seatCount,
          fuelType: filter.fuelType,
          startDate: filter.startDate,
          endDate: filter.endDate,
          transmission: filter.transmission,
        });
        console.log("Fetched approved vehicles:", response.data.vehicles);
        setVehicles(response.data.vehicles);
      } catch (err) {
        console.error("Error fetching approved vehicles:", err);
        // Display error message from backend if available
        setError(err.response?.data?.message || "Không thể tải danh sách xe.");
      }
      setLoading(false);
    };

    fetchApprovedVehicles();
  }, [filter]);

  // fetch all brands :
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/cars/a/brands`, {
          withCredentials: true,
        });
        console.log("Fetched brands:", response.data.brands);
        setBrands(response.data.brands);
      } catch (err) {
        console.error("Error fetching brands:", err);
      }
    };
    fetchBrands();
  }, []);
  // fetch all models :
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/cars/a/models`, {
          withCredentials: true,
        });
        setModels(response.data.models);
      } catch (err) {
        console.error("Error fetching models:", err);
      }
    };
    fetchModels();
  }, []);
  // fetch all locations :
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/cars/a/locations`, {
          withCredentials: true,
        });
        setLocations(response.data.locations);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    fetchLocations();
  }, []);
  // fetch all seatCounts :
  useEffect(() => {
    const fetchSeatCounts = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/cars/a/seatCounts`,
          {
            withCredentials: true,
          }
        );
        setSeatCounts(response.data.seatCounts);
      } catch (err) {
        console.error("Error fetching seat counts:", err);
      }
    };
    fetchSeatCounts();
  }, []);
  // fetch all fuelTypes :
  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/cars/a/fuelTypes`, {
          withCredentials: true,
        });
        setFuelTypes(response.data.fuelTypes);
      } catch (err) {
        console.error("Error fetching fuel types:", err);
      }
    };
    fetchFuelTypes();
  }, []);
  // fetch all transmissions :
  useEffect(() => {
    const fetchTransmissions = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/cars/a/transmissions`,
          {
            withCredentials: true,
          }
        );
        setTransmissions(response.data.transmissions);
      } catch (err) {
        console.error("Error fetching transmissions:", err);
      }
    };
    fetchTransmissions();
  }, []);

  // Render loading, error, or the list
  if (loading) {
    return (
      <div className="vehicle-list-container">Đang tải danh sách xe...</div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-list-container" style={{ color: "red" }}>
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="vehicle-list-container">
      <h1>Danh sách Xe có thể thuê</h1>
      {/* Filter Row */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Model
          </label>
          <select
            name="model"
            value={filter.model}
            onChange={(e) => {
              setFilter({ ...filter, model: e.target.value });
            }}
            className="w-36 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Brand
          </label>
          <select
            name="type"
            value={filter.brand}
            onChange={(e) => {
              setFilter({ ...filter, brand: e.target.value });
            }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Brands</option>
            {brands.length > 0 &&
              brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Location
          </label>
          <select
            name="status"
            value={filter.location}
            onChange={(e) => {
              setFilter({ ...filter, location: e.target.value });
            }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Locations</option>
            {locations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Seat Count
          </label>
          <select
            name="status"
            value={filter.seatCount}
            onChange={(e) => {
              setFilter({ ...filter, seatCount: e.target.value });
            }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Seat Count</option>
            {seatCounts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Fuel Type
          </label>
          <select
            name="status"
            value={filter.fuelType}
            onChange={(e) => {
              setFilter({ ...filter, fuelType: e.target.value });
            }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Fuel Type</option>
            {fuelTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Transmission
          </label>
          <select
            name="status"
            value={filter.transmission}
            onChange={(e) => {
              setFilter({ ...filter, transmission: e.target.value });
            }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Transmission</option>
            {transmissions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={(e) => {
              setFilter({ ...filter, startDate: e.target.value });
            }}
            className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={(e) => {
              setFilter({ ...filter, endDate: e.target.value });
            }}
            className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {vehicles.length === 0 && (
        <div className="no-vehicles-message">
          Không có xe nào phù hợp với bộ lọc của bạn.
        </div>
      )}

      {/* Vehicle List : */}
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
