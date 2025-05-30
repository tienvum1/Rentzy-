import React from "react";
import "./RentalSteps.css";

const RentalSteps = () => {
  return (
    <div className="rental-container">
      <h2 className="title">Cho thuê 3 bước siêu dễ chỉ 10 phút</h2>
      <div className="steps">
        <div className="step">
          <div className="circle">1</div>
          <h4>Chuẩn bị xe và nhận đơn nhẹ nhàng</h4>
          <p>Khi xe sẵn sàng cho thuê, BonbonCar sẽ thay chủ xe định giá cho thuê và ký hợp đồng cho thuê khi khách đặt xe.</p>
        </div>
        <div className="step">
          <div className="circle">2</div>
          <h4>Cho thuê xe nhận nhà</h4>
          <p>Khách thuê sẽ tự lấy xe và trả tại vị trí xe đậu dưới sự giám sát 24/7 của BonbonCar.</p>
        </div>
        <div className="step">
          <div className="circle">3</div>
          <h4>Nhận thu nhập hấp dẫn hàng tuần</h4>
          <p>Nhận tiền thuê và các thu nhập khách hàng tuần.</p>
        </div>
      </div>

      <div className="guarantee">
        <div className="guarantee-left">
          <h3>An tâm tuyệt đối – BonbonCar lo trọn gói</h3>
          <p>
            Đây là giải pháp hoàn hảo cho cho xe bận rộn, muốn kiểm thêm mà chẳng cần bận tâm. BonbonCar kiểm tra kỹ hồ sơ
            từng khách thuê, thậm chí xử lý mọi vấn đề từ giấy tờ pháp lý, phạt nguội và phát sinh.
          </p>
        </div>
        <div className="guarantee-right">
          <div className="guarantee-badge">BonbonCar đảm nhận</div>
          <p>Tư vấn và lựa chọn khách thuê phù hợp. Xác thực và đánh giá hồ sơ khách hàng</p>
          <div className="guarantee-footer">
            <span>1 / 7</span>
            <img src="https://via.placeholder.com/48" alt="customer-support" />
          </div>
        </div>
      </div>

      <div className="safety-section">
        <h3>Bảo vệ xe tối ưu với công nghệ An toàn</h3>
        <p>
          Tất cả trong một giải pháp, không cần tìm kiếm thêm bất kỳ công cụ bổ trợ nào! Xe của bạn được trang bị <span className="highlight">BonbonSmart</span> –
          thiết bị thông minh bảo vệ toàn diện 24/7, theo dõi ngay trên ứng dụng dành riêng.
        </p>
        <div className="features">
          <div className="feature">
            <img src="https://via.placeholder.com/40" alt="smart-card" />
            <p>Giảm rủi ro cắm cọc, trộm cắp với Smart Card</p>
          </div>
          <div className="feature">
            <img src="https://via.placeholder.com/40" alt="nationwide" />
            <p>Luôn biết vị trí xe dù ở ngoài lãnh thổ Việt Nam</p>
          </div>
          <div className="feature">
            <img src="https://via.placeholder.com/40" alt="control" />
            <p>Quản lý cho thuê tiện dụng tất cả trong bàn tay</p>
          </div>
          <div className="feature">
            <img src="https://via.placeholder.com/40" alt="early-warning" />
            <p>Nhận diện sớm rủi ro nhờ cảnh báo thông minh</p>
          </div>
        </div>
      </div>

      <div className="flexibility-section">
        <h3>Linh hoạt sử dụng, xe luôn sẵn sàng cho bạn</h3>
        <p>
          Xe vẫn ở chỗ bạn và bạn <span className="highlight">hoàn toàn chủ động sử dụng xe khi cần</span>, dễ dàng cho thuê kiếm thêm thu nhập khi xe không sử dụng đến
        </p>
        <img src="https://via.placeholder.com/400x200" alt="car-door" className="flexibility-img" />
      </div>

      <div className="comparison-section">
        <h3>BonbonCar: Giải pháp vượt trội cho thuê xe tự lái</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>BonbonCar</th>
              <th>Tự cho thuê</th>
              <th>Nền tảng khác</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tiết kiệm 90% thời gian, công sức cho thuê</td>
              <td>✔</td>
              <td>✖</td>
              <td>✖</td>
            </tr>
            <tr>
              <td>Quy trình quản lý rõ ràng 10 bước chặt chẽ</td>
              <td>✔</td>
              <td>✖</td>
              <td>✖</td>
            </tr>
            <tr>
              <td>Miễn phí lắp đặt thiết bị an toàn</td>
              <td>✔</td>
              <td>✖</td>
              <td>✖</td>
            </tr>
            <tr>
              <td>Thay thế xe giảm sát đảm bảo 24/7</td>
              <td>✔</td>
              <td>✖</td>
              <td>✖</td>
            </tr>
            <tr>
              <td>Xử lý và truy thu phạt người thuê thay cho xe</td>
              <td>✔</td>
              <td>✖</td>
              <td>✖</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RentalSteps;
