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
import UserBookings from "./pages/profile/UserBookings"; // Import UserBookings
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import ChangePassword from "./pages/changePassword/ChangePassword";
import VehicleDetail from "./pages/vehicles/VehicleDetail"; // Import VehicleDetail
import BookingDetailsPage from "./pages/bookings/BookingDetailsPage"; // Import BookingDetailsPage
import PaymentRemaining from './pages/paymentRemaining/PaymentRemaining';

// order booking 
import OrderConfirmation  from "./pages/payment/OrderConfirmation";
import PaymentDeposit  from "./pages/paymentDeposit/PaymentDeposit"

import ConsignForm from "./pages/consignForm/ConsignForm";

// owner
import OwnerPage from "./pages/owner/OwnerPage";
import VehicleManagement from "./pages/vehiclemanagement/VehicleManagement";
import AddCarForm  from "./pages/vehiclemanagement/AddCarForm";


// admin 
import AdminDashboard from "./pages/admin/AdminDashboard";
import OwnerRequestsPage from "./pages/admin/OwnerRequestsPage";
import VehiclesRequestPage from "./pages/admin/VehiclesRequestPage";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";

import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';

// user
import TransactionHistory from './pages/profile/TransactionHistory';
import ManageBooking from "./components/user/ManageBooking";
import WalletInfo from './pages/profile/WalletInfo';

function App() {
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* Wrap the application with AuthProvider */}
        <div className="App">
          <Routes>
             {/* Profile*/}
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/my-bookings" element={<ManageBooking />} /> {/* New route for user bookings */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile/change-password" element={<ChangePassword />}/>
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
            {/* <Route path="/admin" element={<AdminRouteGuard />}> */}
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="owner-requests" element={<OwnerRequestsPage />} />
                <Route path="vehicle-approvals" element={<VehiclesRequestPage />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
            {/* </Route> */}


       
            {/* Route Guard owner  managemnt route */}
            {/*  Chỉ có user đăng kí chủ xe mới dăng nhập được  đăng nhập được */}

            <Route path="/ownerpage" element={<OwnerRouteGuard />}>
                  <Route path="overview" element={<OwnerPage />} />
                 <Route path="vehicle-management" element={<VehicleManagement />} />
                 <Route path="add-car" element={<AddCarForm />} />
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
    </Router>
  );
}

export default App;
