import React, { useState } from 'react';
import './OwnerDashboard.css';
import { MdOutlineDashboard, MdDirectionsCar, MdCalendarMonth, MdNotifications, MdShowChart, MdLogout  } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VehicleManagement from '../vehiclemanagement/VehicleManagement';

const OwnerPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [activeMenuItem, setActiveMenuItem] = useState('overview');

    const handleLogout = async (e) => {
        e.preventDefault();
        await logout();
        navigate('/');
    };

    const renderContent = () => {
        switch (activeMenuItem) {
            case 'overview':
                return (
                    <>
                        <h1>Welcome to your Owner Dashboard</h1>
                        <p>Select an option from the sidebar to manage your properties.</p>
                    </>
                );
            case 'vehicle-management':
                return <VehicleManagement />;
            default:
                return (
                    <>
                        <h1>Welcome to your Owner Dashboard</h1>
                        <p>Select an option from the sidebar to manage your properties.</p>
                    </>
                );
        }
    };

    return(
        <div className="dashboard-container">
            <div className="sidebar">
                <div className="sidebar-header">Owner dashboard</div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <a 
                                href="#"
                                className={`nav-link ${activeMenuItem === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveMenuItem('overview')}
                            >
                                <MdOutlineDashboard />
                                Overview
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a 
                                href="#"
                                className={`nav-link ${activeMenuItem === 'vehicle-management' ? 'active' : ''}`}
                                onClick={() => setActiveMenuItem('vehicle-management')}
                            >
                                <MdDirectionsCar />
                                Vehicle management
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a 
                                href="#"
                                className={`nav-link ${activeMenuItem === 'booking-management' ? 'active' : ''}`}
                                onClick={() => setActiveMenuItem('booking-management')}
                            >
                                <MdCalendarMonth />
                                Booking management
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a 
                                href="#"
                                className={`nav-link ${activeMenuItem === 'notification' ? 'active' : ''}`}
                                onClick={() => setActiveMenuItem('notification')}
                            >
                                <MdNotifications />
                                Notification
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a 
                                href="#"
                                className={`nav-link ${activeMenuItem === 'revenue' ? 'active' : ''}`}
                                onClick={() => setActiveMenuItem('revenue')}
                            >
                                <MdShowChart />
                                Revenue
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="/" className="nav-link" onClick={handleLogout}>
                                <MdLogout />
                                Logout
                            </a>
                        </li>
                        <li className="divider"></li>
                    </ul>
                </nav>
            </div>
            <div className="main-content">
                {renderContent()}
            </div>
        </div>
    );
}

export default OwnerPage;