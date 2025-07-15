import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProfileLayout from '../profileLayout/ProfileLayout';
import './MyReviews.css';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/bookings/user/my-reviews', {
        withCredentials: true
      });
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError('Không thể tải danh sách đánh giá.');
    }
    setLoading(false);
  };

  return (
    <ProfileLayout>
      <div className="my-reviews-container">
        <h2 className="my-reviews-title">Đánh giá bạn đã viết cho các xe</h2>
        {loading ? (
          <div className="my-reviews-loading">Đang tải...</div>
        ) : error ? (
          <div className="my-reviews-error">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="my-reviews-empty">Bạn chưa có đánh giá nào.</div>
        ) : (
          <div className="my-reviews-table-wrapper">
            <table className="my-reviews-table">
              <thead>
                <tr>
                  <th>Xe</th>
                  <th>Biển số</th>
                  <th>Số sao</th>
                  <th>Nội dung</th>
                  <th>Ngày đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id}>
                    <td>{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : 'N/A'}</td>
                    <td>{r.vehicle?.licensePlate || 'N/A'}</td>
                    <td>{r.rating || '-'}</td>
                    <td>{r.review || '-'}</td>
                    <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default MyReviews; 