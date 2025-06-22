import React, { useEffect, useState } from "react";

const ManageBooking = () => {
  // list of bookings
  const [bookings, setBookings] = useState([]);
  // filter for bookings
  const [filter, setFilter] = useState({
    model: "",
    startDate: "",
    endDate: "",
    status: "",
    type: "",
  });
  // all models :
  const [models, setModels] = useState([]);


  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  // use effect to fetch bookings when the filter changes
  useEffect(() => {
    // function to fetch bookings with filter from the server
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/bookings/a/get-filter-bookings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(filter),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    fetchBookings();
  }, [filter]);

  // function to get all models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/bookings/a/get-all-models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        // Assuming you want to set the model filter options here
        setModels(data.models || []);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

  return (
    <div>
      <table
      className="table table-fixed"
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: 20 }}
      >
        <thead>
          <tr>
            <th>
              <select
              className="text-center text-red-500"
                name="model"
                value={filter.model}
                onChange={handleFilterChange}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m || "All Models"}
                  </option>
                ))}
              </select>
            </th>
            <th>
              <select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
              >
                {filter.type &&
                  filter.type.map((t) => (
                    <option key={t} value={t}>
                      {t || "All Types"}
                    </option>
                  ))}
              </select>
            </th>
            <th>
              <select
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
              >
                {filter.status &&
                  filter.status.map((s) => (
                    <option key={s} value={s}>
                      {s || "All Statuses"}
                    </option>
                  ))}
              </select>
            </th>
            <th>
              <input
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                placeholder="Start Date"
              />
            </th>
            <th>
              <input
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                placeholder="End Date"
              />
            </th>
            <th className="text-red-500">Total Amount</th>
            <th>Deposit</th>
            <th>Reservation Fee</th>
            <th>Pickup Location</th>
            <th>Return Location</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, idx) => (
            <tr key={idx}>
              <td>{b.vehicle?.model}</td>
              <td>{b.vehicle?.type}</td>
              <td>{b.status}</td>
              <td>{b.startDate?.slice(0, 10)}</td>
              <td>{b.endDate?.slice(0, 10)}</td>
              <td>{b.totalAmount}</td>
              <td>{b.deposit}</td>
              <td>{b.reservationFee}</td>
              <td>{b.pickupLocation}</td>
              <td>{b.returnLocation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageBooking;
