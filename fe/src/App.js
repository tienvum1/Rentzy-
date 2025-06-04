// fe/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import OwnerRouteGuard from './components/OwnerRouteGuard/OwnerRouteGuard'; // Import OwnerRouteGuard

import Homepage from "./pages/homepage/Homepage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import ProfilePage from "./pages/profile/ProfilePage"; // IMPORT: New ProfilePage component
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import ChangePassword from "./pages/changePassword/ChangePassword";

import ConsignForm from "./pages/consignForm/ConsignForm";

// owner
import OwnerPage from "./pages/owner/OwnerPage";
import VehicleManagement from "./pages/vehiclemanagement/VehicleManagement";
import AddCarForm  from "./pages/vehiclemanagement/AddCarForm";


// admin 
import AdminDashboard from "./pages/admin/AdminDashboard";
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
            <Route path="/profile/change-password" element={<ChangePassword />}/>
            {/* Add route for OwnerPage */}
            <Route path="/consignForm" element={<ConsignForm />} />
            {/* Add a root route if needed */}
            <Route path="/" element={<Homepage />} />

            {/* admin route */}
            <Route path="/adminDashboard" element={<AdminDashboard />} />
            <Route path="/admin/owner-requests" element={<OwnerRequestsPage />} />
            <Route path="/admin/vehicle-approvals" element={<VehiclesRequestPage />} />


       
            {/* Route Guard owner  managemnt route */}
            <Route path="/ownerpage" element={<OwnerRouteGuard />}>
  <Route path="overview" element={<OwnerPage />} />
  <Route path="vehicle-management" element={<VehicleManagement />} />
  <Route path="add-car" element={<AddCarForm />} />
</Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
