import React from 'react';
import './CancellationPolicy.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const CancellationPolicy = () => {
  const policies = [
    {
      icon: <FaCheckCircle className="icon success" />,
      title: 'Hoàn 100% Tiền Giữ Chỗ',
      normalDay: 'Trước Chuyến Đi > 10 Ngày',
      holiday: 'Không Áp Dụng',
    },
    {
      icon: <FaCheckCircle className="icon success" />,
      title: 'Hoàn 30% Tiền Giữ Chỗ',
      normalDay: 'Trước Chuyến Đi > 5 Ngày',
      holiday: 'Trước Chuyến Đi > 30 Ngày',
    },
    {
      icon: <FaTimesCircle className="icon danger" />,
      title: 'Không Hoàn Tiền Giữ Chỗ',
      normalDay: 'Trong Vòng 5 Ngày Trước Chuyến Đi',
      holiday: 'Trong Vòng 30 Ngày Trước Chuyến Đi',
    },
  ];

  return (
    <div className="cancellation-policy">
      <h2>Chính sách huỷ chuyến</h2>
      <div className="table">
        <div className="table-header">
          <div className="cell header empty"></div>
          <div className="cell header">Ngày Thường</div>
          <div className="cell header">Ngày Lễ, Tết</div>
        </div>
        {policies.map((item, index) => (
          <div className="table-row" key={index}>
            <div className="cell policy">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <div className="cell">{item.normalDay}</div>
            <div className="cell">{item.holiday}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CancellationPolicy;
