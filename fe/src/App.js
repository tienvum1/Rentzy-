// fe/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider

import Homepage from "./pages/homepage/Homepage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import SetPassword from "./pages/setPassword/SetPassword";

function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap the application with AuthProvider */}
        <div className="App">
          <Routes>
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/set-password" element={<SetPassword />} />
            {/* Add a root route if needed */}
             <Route path="/" element={<Homepage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;