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

import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import ChangePassword from "./pages/changePassword/ChangePassword";
import VehicleDetail from "./pages/vehicles/VehicleDetail"; // Import VehicleDetail
import BookingDetailsPage from "./pages/bookings/BookingDetailsPage"; // Import BookingDetailsPage


import ConsignForm from "./pages/consignForm/ConsignForm";

// order booking  payment
import OrderConfirmation from "./pages/payment/paymentConfirm/OrderConfirmation";
import PaymentDeposit from "./pages/payment/paymentDeposit/PaymentDeposit";
import PaymentRemaining from './pages/payment/paymentRemaining/PaymentRemaining';




// user
import Profile from "./pages/profile/myAccount/Profile"; // IMPORT: New ProfilePage component
import UserBookings from "./pages/profile/myBookings/UserBookings"; // Import UserBookings
import TransactionHistory from './pages/profile/myTransactions/TransactionHistory';
import WalletInfo from './pages/profile/myWallet/WalletInfo';
import NotificationPage from './pages/profile/myNotifications/NotificationPage';

// owner
import OwnerPage from "./pages/owner/Ownerpage";
import VehicleManagement from "./pages/owner/vehiclemanagement/VehicleManagement";
import AddVehicleForm from "./pages/owner/vehiclemanagement/AddVehicleForm";
import OwnerVehicleDetail from './pages/owner/vehiclemanagement/OwnerVehicleDetail';
import EditVehicleForm from "./pages/owner/vehiclemanagement/EditVehicleForm";

import OwnerNotificationPage from "./pages/owner/ownerNotifications/OwnerNotificationPage";
import OwnerBookingManagement from "./pages/owner/ownerBookings/OwnerBookingManagement";
import OwenerCancelRequest from "./pages/owner/ownerBookings/OwnerCancelRequests";

// admin 
import AdminDashboard from "./pages/admin/ adminDashboard/AdminDashboard";
import OwnerRequestsPage from "./pages/admin/adminOwnerRequestsPage/OwnerRequestsPage";
import VehiclesRequestPage from "./pages/admin/adminVehiclesRequestPage/VehiclesRequestPage";
import AdminWithdrawals from "./pages/admin/adminWithdrawals/AdminWithdrawals";
import DriverLicenseRequestsPage from "./pages/admin/adminDriverLicenseRequestsPage/DriverLicenseRequestsPage";
import AdminVehicleDetailPage from './pages/admin/adminAdminVehicleDetailPage/AdminVehicleDetailPage';
import VehicleChangesPage from "./pages/admin/adminVehicleChangesPage/VehicleChangesPage";


import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Wrap the application with AuthProvider */}
        <div className="App">
          <Routes>
            {/* Profile*/}
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Profile*/}
            <Route path="/profile/account" element={<Profile />} />
            <Route path="/profile/favorites" element={<Profile />} />
            <Route path="/profile/my-bookings" element={<UserBookings />} /> {/* New route for user bookings */}
            <Route path="/profile/my-notifications" element={<NotificationPage />} />
           
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile/change-password" element={<ChangePassword />} />
            <Route path="/profile/transactions" element={<TransactionHistory />} />
            <Route path="/profile/wallet" element={<WalletInfo />} />

            <Route path="/vehicles/:id" element={<VehicleDetail />} /> {/* Add VehicleDetail route */}

            {/* Add VehicleDetail route */}
            <Route path="/confirm/:bookingId" element={<OrderConfirmation />} />
            <Route path="/payment-deposit/:bookingId" element={<PaymentDeposit />} />
            <Route path="/bookings/:id" element={<BookingDetailsPage />} /> {/* New route for Booking Details */}
            <Route path="/payment-remaining/:id" element={<PaymentRemaining />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />



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
              <Route path="vehicle-approvals/:id" element={<AdminVehicleDetailPage />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              {/* </Route> */}
              <Route path="driver-license-requests" element={<DriverLicenseRequestsPage />} />
            </Route>
            <Route path="/adminDashboard" element={<AdminDashboard />} />
            <Route path="/admin/owner-requests" element={<OwnerRequestsPage />} />
            <Route path="/admin/vehicle-approvals" element={<VehiclesRequestPage />} />
            <Route path="/admin/vehicle-changes" element={<VehicleChangesPage />} />

            {/* Route Guard owner  managemnt route */}
            {/*  Chỉ có user đăng kí chủ xe mới dăng nhập được  đăng nhập được */}

            <Route path="/ownerpage" element={<OwnerRouteGuard />}>        
              <Route path="overview" element={<OwnerPage />} />
              <Route path="vehicle-management" element={<VehicleManagement />} />
              <Route path="add-vehicle" element={<AddVehicleForm />} />
              <Route path="vehicle/:id" element={<OwnerVehicleDetail />} />
              <Route path="edit-vehicle/:id" element={<EditVehicleForm />} />
              <Route path="notifications" element={<OwnerNotificationPage />} />
              <Route path="booking-management" element={<OwnerBookingManagement />} />
              <Route path="cancel-requests" element={<OwenerCancelRequest />} />
              
  

            </Route>





            {/* 404 Route - Thêm route cho trang không tìm thấy */}
            <Route
              path="*"
              element={
                <div className="not-found">
                  <h1>404 - Page Not Found</h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router >
  );
}

export default App;
