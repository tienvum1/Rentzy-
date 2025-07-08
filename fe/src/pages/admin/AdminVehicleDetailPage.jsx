import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarAdmin from '../../components/SidebarAdmin/SidebarAdmin';
import './AdminDashboard.css';
import './AdminVehicleDetailPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4999';
const adminApi = `${backendUrl}/api/admin`;

const AdminVehicleDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoomImage, setZoomImage] = useState(null); // State for zoomed image

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${adminApi}/vehicle-approvals/${id}`, { withCredentials: true });
                setVehicle(response.data.vehicle);
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải chi tiết xe.');
            }
            setLoading(false);
        };
        if (id) fetchDetail();
    }, [id]);

    const handleImageClick = (imgUrl) => {
        setZoomImage(imgUrl);
    };
    const closeZoom = () => setZoomImage(null);

    if (loading) return <div className="admin-dashboard-content"><p>Đang tải chi tiết xe...</p></div>;
    if (error) return <div className="admin-dashboard-content"><p className="error-message">{error}</p></div>;
    if (!vehicle) return <div className="admin-dashboard-content"><p>Không tìm thấy xe.</p></div>;

    return (
        <div className="admin-dashboard-layout">
            <SidebarAdmin />
            <div className="admin-dashboard-content">
                <div className="vehicles-requests-inner-content">
                    <button className="btn-action btn-close" onClick={() => navigate(-1)}>Quay lại</button>
                    <h2>Chi tiết xe chờ duyệt</h2>
                    <div className="vehicle-detail-admin">
                        <div className="vehicle-detail-images">
                            {vehicle.primaryImage && (
                                <img src={vehicle.primaryImage} alt="Ảnh chính" className="vehicle-detail-main-img" onClick={() => handleImageClick(vehicle.primaryImage)} style={{cursor:'zoom-in'}} />
                            )}
                            {vehicle.gallery && vehicle.gallery.length > 0 && (
                                <div className="vehicle-detail-gallery">
                                    {vehicle.gallery.map((img, idx) => (
                                        <img key={idx} src={img} alt={`Ảnh phụ ${idx + 1}`} className="vehicle-detail-gallery-img" onClick={() => handleImageClick(img)} style={{cursor:'zoom-in'}} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="vehicle-detail-info">
                            <p><b>Thương hiệu:</b> {vehicle.brand}</p>
                            <p><b>Model:</b> {vehicle.model}</p>
                            <p><b>Biển số:</b> {vehicle.licensePlate}</p>
                            <p><b>Giá/ngày:</b> {vehicle.pricePerDay ? parseFloat(vehicle.pricePerDay).toLocaleString() + ' VNĐ' : 'N/A'}</p>
                            <p><b>Tiền đặt cọc:</b> {vehicle.deposit ? parseFloat(vehicle.deposit).toLocaleString() + ' VNĐ' : 'N/A'}</p>
                            <p><b>Số chỗ:</b> {vehicle.seatCount}</p>
                            <p><b>Kiểu dáng:</b> {vehicle.bodyType}</p>
                            <p><b>Truyền động:</b> {vehicle.transmission}</p>
                            <p><b>Nhiên liệu:</b> {vehicle.fuelType}</p>
                            <p><b>Mức tiêu thụ nhiên liệu:</b> {vehicle.fuelConsumption}</p>
                            <p><b>Tiện nghi:</b> {vehicle.features && Array.isArray(vehicle.features) ? vehicle.features.join(', ') : vehicle.features}</p>
                            <p><b>Chính sách thuê:</b> {vehicle.rentalPolicy}</p>
                            <p><b>Mô tả:</b> {vehicle.description}</p>
                            <p><b>Chủ xe:</b> {vehicle.owner ? `${vehicle.owner.name} (${vehicle.owner.email})` : 'N/A'}</p>
                            <p><b>Trạng thái duyệt:</b> {vehicle.approvalStatus}</p>
                            <p><b>Trạng thái xe:</b> {vehicle.status}</p>
                        </div>
                    </div>
                </div>
                {/* Zoomed image modal */}
                {zoomImage && (
                    <div className="zoom-modal-backdrop" onClick={closeZoom}>
                        <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                            <img src={zoomImage} alt="Phóng to" className="zoom-modal-img" />
                            <button className="btn-action btn-close" onClick={closeZoom} style={{marginTop: 16}}>Đóng</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVehicleDetailPage; 