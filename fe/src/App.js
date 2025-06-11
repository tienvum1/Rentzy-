// fe/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import OwnerRouteGuard from './components/OwnerRouteGuard/OwnerRouteGuard'; // Import OwnerRouteGuard
import AdminRouteGuard from './components/AdminRouteGuard/AdminRouteGuard'; // Import AdminRouteGuard

import Homepage from "./pages/homepage/Homepage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import ProfilePage from "./pages/profile/ProfilePage"; // IMPORT: New ProfilePage component
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import ChangePassword from "./pages/changePassword/ChangePassword";
import VehicleDetail from "./pages/vehicles/VehicleDetail"; // Import VehicleDetail

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
            <Route path="/vehicles/:id" element={<VehicleDetail />} /> {/* Add VehicleDetail route */}
            {/* Add route for OwnerPage */}
            <Route path="/consignForm" element={<ConsignForm />} />
            {/* Add a root route if needed */}
            <Route path="/" element={<Homepage />} />

            {/* admin route */}
             {/* chỉ admin có quyền truy cập */}
            <Route path="/admin" element={<AdminRouteGuard />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="owner-requests" element={<OwnerRequestsPage />} />
                <Route path="vehicle-approvals" element={<VehiclesRequestPage />} />
            </Route>


       
            {/* Route Guard owner  managemnt route */}
            {/*  Chỉ có user đăng kí chủ xe mới dăng nhập được  đăng nhập được */}

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
