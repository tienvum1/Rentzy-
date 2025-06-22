import { useEffect, useState } from "react";
import ProfileSidebar from "../../pages/profile/ProfileSidebar";
import Header from "../../components/Header/Header";
import Footer from "../../components/footer/Footer";
import DriverLicenseVerification from "../../pages/profile/DriverLicenseVerification";
import "../../pages/profile/Profile.css";

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState("account");
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile-page__sidebar">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>
        <div className="profile-page__content">
          {activeSection === "account" && <ManageBooking />}
          {/* Các component khác như Favorites, MyCars... có thể thêm vào sau */}
          {activeSection !== "account" && (
            <div style={{ padding: "2rem" }}>
              <h2>Chức năng “{activeSection}” đang được phát triển.</h2>
              <p>Vui lòng quay lại sau!</p>
            </div>
          )}
        </div>
      </div>
      <DriverLicenseVerification />
      <Footer />
    </>
  );
};

export default ProfilePage;

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

  // Table and filter UI
  return (
    <div className=" bg-gray-100 min-h-screen p-">
      {/* Main Content Area */}
      <div className="">
        {/* Header/Breadcrumbs */}
        <div className=" flex justify-between items-center px-2 py-6 bg-white rounded-lg shadow">
          <div className="text-gray-500 text-sm px-9">
            Dashboards &gt;{" "}
            <span className="font-semibold text-gray-800">Bookings</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <svg
                className="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <img
                src="https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png"
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-gray-700 text-sm font-medium">
                Ahmed Ihslaq Khan
              </span>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-end shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Model</label>
            <select
              name="model"
              value={filter.model}
              onChange={handleFilterChange}
              className="w-36 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Models</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
            <select
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Truck">Truck</option>
              {/* Add more types as needed */}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Model</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Type</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Start Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">End Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Total</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Deposit</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Reservation Fee</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Pickup</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Return</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((b, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-semibold text-gray-700">{idx + 1}</td>
                    <td className="px-3 py-2">{b.vehicle?.model}</td>
                    <td className="px-3 py-2">{b.vehicle?.type}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${b.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
                        ${b.status === "accepted" ? "bg-green-100 text-green-800" : ""}
                        ${b.status === "canceled" ? "bg-red-100 text-red-800" : ""}
                      `}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{b.startDate?.slice(0, 10)}</td>
                    <td className="px-3 py-2">{b.endDate?.slice(0, 10)}</td>
                    <td className="px-3 py-2">{b.totalAmount}</td>
                    <td className="px-3 py-2">{b.deposit}</td>
                    <td className="px-3 py-2">{b.reservationFee}</td>
                    <td className="px-3 py-2">{b.pickupLocation}</td>
                    <td className="px-3 py-2">{b.returnLocation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}