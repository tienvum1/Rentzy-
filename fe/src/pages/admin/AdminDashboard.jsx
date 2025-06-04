import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import './AdminDashboard.css'; // Optional: Create specific CSS for admin dashboard
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin'; // Assuming this path is correct

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, isLoading, isAuthenticated } = useAuth();

    // Check user role and redirect if not admin
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !user || !user.role.includes('admin'))) {
            // Redirect to home or login if not authenticated or not admin
            navigate('/'); // Or navigate('/login'); depending on desired behavior
        }
    }, [user, isLoading, isAuthenticated, navigate]); // Dependencies

    // While loading or if not admin, render nothing or a loading spinner
    if (isLoading || !isAuthenticated || !user || !user.role.includes('admin')) {
        return null; // Or <LoadingSpinner />
    }

    // Render dashboard content for admin users
    return (
        <div className="admin-dashboard-layout"> {/* Use a layout class */}
            <SidebarAdmin /> {/* Admin sidebar */}
            <div className="admin-dashboard-content"> {/* Main content area */}
                <h2>Admin Dashboard</h2>
                <p>Chào mừng đến với trang quản trị.</p>
                {/* Content for different sections will go here */}

                {/* Placeholder for future sections */}
                <section>
                    <h3>Quản lý người dùng (Upcoming)</h3>
                    <p>Danh sách người dùng, chỉnh sửa, xóa, phân quyền.</p>
                </section>

                <section>
                    <h3>Quản lý xe (Upcoming)</h3>
                    <p>Danh sách xe, duyệt xe, chỉnh sửa, xóa.</p>
                </section>

                <section>
                    <h3>Duyệt yêu cầu chủ xe (Upcoming)</h3>
                    <p>Xem và duyệt các yêu cầu trở thành chủ xe.</p>
                </section>

            </div>
        </div>
    );
};

export default AdminDashboard;
