import React from 'react';
import './OwnerDashboard.css';
import { MdOutlineDashboard, MdDirectionsCar, MdCalendarMonth, MdNotifications, MdShowChart, MdLogout  } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OwnerPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async (e) => {
        e.preventDefault();
        await logout();
        navigate('/');
    };

    return(
        <div className="dashboard-container">
            <div className="sidebar">
                <div className="sidebar-header">Owner dashboard</div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <a href="#" className="nav-link">
                                <MdOutlineDashboard />
                                Overview
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" className="nav-link">
                                <MdDirectionsCar />
                                Vehicle management
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" className="nav-link">
                                <MdCalendarMonth />
                                Booking management
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" className="nav-link">
                                <MdNotifications />
                                Notification
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" className="nav-link">
                                <MdShowChart />
                                Revenue
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" className="nav-link" onClick={handleLogout}>
                                <MdLogout />
                                Logout
                            </a>
                        </li>
                        <li className="divider"></li>
                    </ul>
                </nav>
            </div>
            <div className="main-content">
                {/* Content will be rendered here based on selected menu item */}
                <h1>Welcome to your Owner Dashboard</h1>
                <p>Select an option from the sidebar to manage your properties.</p>
            </div>
        </div>
    );
}

export default OwnerPage;