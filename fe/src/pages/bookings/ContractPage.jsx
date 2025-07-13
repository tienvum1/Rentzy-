import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ContractPage.css';

const ContractPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/contract/${bookingId}`, { withCredentials: true });
        setBooking(res.data.booking);
      } catch (err) {
        setError('Không tìm thấy hợp đồng hoặc đơn thuê.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) return <div className="contract-loading">Đang tải hợp đồng...</div>;
  if (error || !booking) return <div className="contract-error">{error || 'Không tìm thấy hợp đồng.'}</div>;

  const { vehicle, renter, startDate, endDate, totalAmount, deposit } = booking;
  const owner = vehicle?.owner;
  const today = new Date();
  const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN');

  return (
    <div className="contract-root">
      <div className="contract-header-row">
        <div className="contract-header-right" style={{marginLeft: 'auto'}}>
          <div className="contract-nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="contract-motto">Độc lập – Tự do – Hạnh phúc</div>
          <div className="contract-dash">-----------------00-----------------</div>
          <div className="contract-number">Số: {today.getDate()}/{today.getFullYear()}/TD-LD</div>
          <div className="contract-date">Đà Nẵng, ngày {today.getDate()} tháng {today.getMonth()+1} năm {today.getFullYear()}</div>
        </div>
      </div>
      <h2 className="contract-title-main">HỢP ĐỒNG THUÊ XE Ô TÔ</h2>
      <div className="contract-legal">
        <div>- Căn cứ Bộ luật Dân sự năm 2015;</div>
        <div>- Căn cứ Luật Thương mại năm 2005;</div>
        <div>- Căn cứ nhu cầu và thỏa thuận của hai bên;</div>
      </div>
      <div className="contract-between">Hợp đồng này được lập giữa các bên:</div>
      <div className="contract-party contract-party-a">
        <b>Bên A (Người cho thuê):</b>
        <div>Họ tên: <b>{owner?.name}</b></div>
        <div>Email: <b>{owner?.email}</b></div>
        <div>Số điện thoại: <b>{owner?.phone}</b></div>
        <div>Số CCCD: <b>{owner?.cccd_number}</b></div>
      </div>
      <div className="contract-party contract-party-b">
        <b>Bên B (Người thuê):</b>
        <div>Họ tên: <b>{renter?.driver_license_full_name || renter?.name}</b></div>
        <div>Số điện thoại: <b>{renter?.phone}</b></div>
        <div>Số GPLX: <b>{renter?.driver_license_number}</b></div>
      </div>
      <div className="contract-agree">Hai bên thống nhất các điều khoản dưới đây:</div>

      <div className="contract-section">
        <b>Điều 1: Thông tin xe cho thuê</b>
        <ul style={{marginLeft: 18}}>
          <li>Hãng xe: <b>{vehicle?.brand}</b></li>
          <li>Dòng xe: <b>{vehicle?.model}</b></li>
          <li>Biển số: <b>{vehicle?.licensePlate}</b></li>
        </ul>
      </div>

      <div className="contract-section">
        <b>Điều 2: Thời hạn và chi phí thuê xe</b>
        <div>Thời gian thuê: Từ <b>{formatDate(startDate)}</b> đến <b>{formatDate(endDate)}</b>.</div>
        <div>Địa điểm nhận xe: <b>{booking.pickupLocation}</b></div>
        <div>Địa điểm trả xe: <b>{booking.returnLocation}</b></div>
        <div>Số tiền thuê: <b>{totalAmount?.toLocaleString('vi-VN')}đ</b> cho toàn bộ thời gian thuê.</div>
        <div>Tiền đặt cọc: <b>{deposit?.toLocaleString('vi-VN')}đ</b> (sẽ được hoàn trả sau khi kết thúc hợp đồng nếu không phát sinh vi phạm/hư hỏng).</div>
        <div>Quá thời hạn trên, nếu Bên B muốn gia hạn phải thông báo trước cho Bên A và được Bên A đồng ý.</div>
      </div>

      <div className="contract-section">
        <b>Điều 3: Quyền và nghĩa vụ của các bên</b>
        <ul style={{marginLeft: 18}}>
          <li><b>Bên A (Người cho thuê):</b>
            <ul>
              <li>Giao xe đúng hiện trạng, đủ giấy tờ, bảo hiểm, đúng thời gian, địa điểm.</li>
              <li>Hỗ trợ Bên B trong quá trình thuê xe nếu có sự cố kỹ thuật.</li>
              <li>Hoàn trả cọc đúng hạn nếu Bên B không vi phạm hợp đồng.</li>
            </ul>
          </li>
          <li><b>Bên B (Người thuê):</b>
            <ul>
              <li>Sử dụng xe đúng mục đích, không cho người khác thuê lại, không sử dụng vào mục đích vi phạm pháp luật.</li>
              <li>Bảo quản xe, chịu trách nhiệm bồi thường nếu làm hư hỏng, mất mát, vi phạm giao thông.</li>
              <li>Trả xe đúng thời gian, địa điểm, hiện trạng ban đầu (trừ hao mòn tự nhiên).</li>
              <li>Thanh toán đầy đủ các khoản phát sinh (nếu có): phí phạt, phí vệ sinh, phí trễ hạn, v.v.</li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="contract-section">
        <b>Điều 4: Xác nhận giao nhận xe</b>
        <div>
          Hai bên sẽ cùng kiểm tra hiện trạng xe (ngoại thất, nội thất, mức xăng, giấy tờ, phụ kiện đi kèm...) khi giao và nhận xe. Mọi phát sinh, hư hỏng, thiếu sót sẽ được ghi nhận bằng biên bản riêng hoặc cập nhật trên hệ thống.
        </div>
      </div>

      <div className="contract-section">
        <b>Điều 5: Xử lý vi phạm và chấm dứt hợp đồng</b>
        <ul style={{marginLeft: 18}}>
          <li>Nếu Bên B trả xe trễ, sẽ bị tính phí theo quy định của Bên A hoặc nền tảng.</li>
          <li>Nếu phát hiện sử dụng xe sai mục đích, Bên A có quyền thu hồi xe và không hoàn cọc.</li>
          <li>Hợp đồng chấm dứt khi hai bên hoàn thành nghĩa vụ, hoặc theo thỏa thuận/hủy ngang có lý do chính đáng.</li>
        </ul>
      </div>

      <div className="contract-section">
        <b>Điều 6: Giải quyết tranh chấp</b>
        <div>Hai bên ưu tiên giải quyết tranh chấp bằng thương lượng, hòa giải. Nếu không giải quyết được, tranh chấp sẽ được đưa ra tòa án có thẩm quyền theo quy định pháp luật Việt Nam.</div>
      </div>

      <div className="contract-section">
        <b>Điều 7: Hiệu lực hợp đồng</b>
        <div>Hợp đồng có hiệu lực từ khi hai bên ký tên/xác nhận điện tử và Bên B đã thanh toán đặt cọc.</div>
        <div>Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản, có giá trị pháp lý như nhau.</div>
      </div>

      <div className="contract-signature-row">
        <div className="contract-signature-col">
          <b>BÊN A</b>
          <div className="contract-signature-space">(Ký, ghi rõ họ tên)</div>
          <div className="contract-signature-box"></div>
          <div className="contract-signature-name">{owner?.name}</div>
        </div>
        <div className="contract-signature-col">
          <b>BÊN B</b>
          <div className="contract-signature-space">(Ký, ghi rõ họ tên)</div>
          <div className="contract-signature-box"></div>
          <div className="contract-signature-name">{renter?.driver_license_full_name || renter?.name}</div>
        </div>
      </div>
      <div className="contract-footer-note">Hợp đồng được tạo tự động bởi hệ thống. Mọi tranh chấp sẽ được giải quyết theo quy định pháp luật Việt Nam và chính sách của nền tảng.</div>
    </div>
  );
};

export default ContractPage; 