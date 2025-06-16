import React from 'react';
import { FaCheck, FaCar, FaRegCircle } from 'react-icons/fa';
import { MdContentCopy } from "react-icons/md";
import './ReservationPayment.css';

const ReservationPayment = () => {
  return (
    <div className="reservation-payment-container">
      <div className="progress-bar-wrapper">
        <div className="progress-steps">
          <div className="progress-step completed">
            <FaCheck />
            <span>Tìm và chọn xe</span>
          </div>
          <div className="progress-divider completed"></div>
          <div className="progress-step completed">
            <FaCheck />
            <span>Xác nhận đơn hàng</span>
          </div>
          <div className="progress-divider current"></div>
          <div className="progress-step current">
            <FaCar />
            <span>Thanh toán giữ chỗ</span>
          </div>
          <div className="progress-divider"></div>
          <div className="progress-step">
            <FaRegCircle />
            <span>Tải app & lấy xe</span>
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="payment-details-section">
          <h2 className="section-title">Thanh toán phí giữ chỗ</h2>
          <p className="deposit-amount">500.000₫</p>
          <p className="time-left-label">Thời gian giữ chỗ còn lại</p>
          <div className="countdown-timer">14:52</div>
          <p className="order-code-label">Mã đặt xe của bạn <span className="order-code">1750053173</span></p>
          <div className="car-info-box">
            <p>Loại xe: <span className="car-model">KIA K3</span></p>
            <p>Ngày nhận trả xe: <span className="return-date">16/06/2025 tới 01/07/2025</span></p>
          </div>

          <div className="qr-payment-section">
            <h3 className="section-subtitle">Thanh toán bằng mã QR</h3>
            <p className="qr-instruction">Vui lòng quét mã QRCode hoặc chụp ảnh màn hình QRCode để thanh toán bằng ứng dụng ngân hàng</p>
            <div className="qr-code-area">
              <img src="/images/qr-code.png" alt="QR Code" className="qr-code-image" />
              <div className="bank-logos">
                <img src="/images/vietqr.png" alt="VietQR" />
                <img src="/images/napas247.png" alt="Napas 247" />
                <img src="/images/mb-bank.png" alt="MB Bank" />
              </div>
            </div>
            <p className="or-separator">hoặc</p>
            <h3 className="section-subtitle red-text">Chuyển khoản qua ngân hàng</h3>
            <p className="bank-transfer-instruction">Vui lòng nhập chính xác cú pháp chuyển khoản để hệ thống ghi nhận thông tin đơn hàng</p>
            <div className="bank-info-item">
              <span className="bank-info-label">Chủ tài khoản:</span>
              <span className="bank-info-value">MBBank(MB)</span>
            </div>
            <div className="bank-info-item">
              <span className="bank-info-label">Số tài khoản:</span>
              <span className="bank-info-value">4393689999</span>
              <button className="copy-button">
                <MdContentCopy /> Sao chép
              </button>
            </div>
            <div className="bank-info-item">
              <span className="bank-info-label">Cú pháp CK:</span>
              <span className="bank-info-value">BBC1750053173</span>
              <button className="copy-button">
                <MdContentCopy /> Sao chép
              </button>
            </div>
          </div>
        </div>

        <div className="order-summary-section">
          <h2 className="section-title">Thông tin đơn thuê</h2>
          <div className="car-image-container">
            <img src="/images/car-placeholder.png" alt="Car" className="car-image" />
          </div>
          <div className="order-details-info">
            <div className="detail-row">
              <span>Mã đặt xe</span>
              <span className="detail-value">1750053173</span>
            </div>
            <div className="detail-row">
              <span>Tên khách thuê</span>
              <span className="detail-value">ok</span>
            </div>
            <div className="detail-row">
              <span>Số điện thoại</span>
              <span className="detail-value">0815618427</span>
            </div>
            <div className="detail-row">
              <span>Ngày nhận:</span>
              <span className="detail-value">16/06/2025 16:00</span>
            </div>
            <div className="detail-row">
              <span>Ngày trả:</span>
              <span className="detail-value">01/07/2025 20:00</span>
            </div>
            <div className="detail-row">
              <span>Loại xe:</span>
              <span className="detail-value">KIA K3</span>
            </div>
            <div className="total-rental-fee-box">
              <span>Tổng cộng tiền thuê xe</span>
              <span className="total-fee">15.754.200₫</span>
              <p>Bạn sẽ thanh toán khi nhận xe</p>
            </div>
          </div>

          <h2 className="section-title">Các bước thanh toán</h2>
          <div className="payment-steps-summary">
            <div className="payment-step-item">
              <div className="step-number completed">1</div>
              <div className="step-content">
                <p className="step-title">Thanh toán giữ chỗ qua BonbonCar</p>
                <p className="step-description">Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào tiền thế chấp khi nhận xe</p>
              </div>
              <span className="step-amount">500.000₫</span>
            </div>
            <div className="payment-step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <p className="step-title">Thanh toán khi nhận xe</p>
                <div className="sub-details">
                  <p><span className="sub-label">20.754.200₫</span></p>
                  <p><span className="sub-label">Tiền thuê</span> <span className="sub-value">15.754.200₫</span></p>
                  <p><span className="sub-label">Tiền thế chấp</span> <span className="sub-value">5.500.000₫ 5.000.000₫</span></p>
                  <p className="note">Sẽ hoàn lại khi trả xe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPayment; 