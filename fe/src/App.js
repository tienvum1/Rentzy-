// fe/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider

import Homepage from "./pages/homepage/Homepage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import ProfilePage from "./pages/profile/ProfilePage"; // IMPORT: New ProfilePage component
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";


import ConsignForm from "./pages/consignForm/ConsignForm";

// owner
import OwnerPage from "./pages/owner/OwnerPage";
import VehicleManagement from "./pages/vehiclemanagement/VehicleManagement";


// admin 
import OwnerRequestsPage from "./pages/admin/OwnerRequestsPage";
import VehiclesRequestPage from "./pages/admin/VehiclesRequestPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* Wrap the application with AuthProvider */}
        <div className="App">
          <Routes>
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Add route for OwnerPage */}
            <Route path="/consignForm" element={<ConsignForm />} />
            {/* Add a root route if needed */}
            <Route path="/" element={<Homepage />} />

            {/* admin route */}
            <Route path="/admin/owner-requests" element={<OwnerRequestsPage />} />
            <Route path="/admin/vehicle-approvals" element={<VehiclesRequestPage />} />



             {/* owner route */}
            <Route path="/ownerpage/overview" element={<OwnerPage />} />
            <Route path="/ownerpage/vehicle-management" element={<VehicleManagement />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
