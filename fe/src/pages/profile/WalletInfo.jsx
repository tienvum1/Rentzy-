import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../components/Header/Header';
import ProfileSidebar from './ProfileSidebar';
import './WalletInfo.css';

const WalletInfo = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountName: '',
    accountNumber: '',
    bankName: ''
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchWallet = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`, { withCredentials: true });
        if (isMounted) setWallet(res.data.wallet);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Không thể lấy thông tin ví');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchWallet();
    return () => { isMounted = false; };
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);
    try {
      // Gọi API rút tiền (bạn cần tạo API này ở backend)
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/withdraw`,
        {
          ...bankInfo,
          amount: withdrawAmount
        },
        { withCredentials: true }
      );
      setWithdrawSuccess('Yêu cầu rút tiền đã được gửi!');
      setWithdrawAmount('');
      setBankInfo({ accountName: '', accountNumber: '', bankName: '' });
      // Có thể reload lại số dư ví nếu muốn
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="profile-page-container">
        <ProfileSidebar />
        <main className="profile-main-content">
          <h2>Thông tin ví của tôi</h2>
          <div className="wallet-info-box">
            {loading ? (
              <div className="wallet-loading">Đang tải ví...</div>
            ) : error ? (
              <div className="wallet-error">{error}</div>
            ) : wallet ? (
              <>
                <div className="wallet-balance-row">
                  <span className="wallet-balance-label">Số dư:</span>
                  <span className="wallet-balance-value">{wallet.balance.toLocaleString('vi-VN')} {wallet.currency}</span>
                </div>
                <div className="wallet-row"><strong>Trạng thái:</strong> {wallet.status === 'active' ? 'Đang hoạt động' : wallet.status}</div>
                <div className="wallet-row"><strong>Ngày tạo ví:</strong> {new Date(wallet.createdAt).toLocaleString('vi-VN')}</div>
                <div className="wallet-row"><strong>Ngày cập nhật:</strong> {new Date(wallet.updatedAt).toLocaleString('vi-VN')}</div>
                <button className="withdraw-btn" onClick={() => setShowWithdrawForm(true)}>
                  Rút tiền
                </button>
              </>
            ) : (
              <div className="wallet-error">Không tìm thấy ví.</div>
            )}
          </div>
          {showWithdrawForm && (
            <div className="withdraw-modal">
              <div className="withdraw-form-box">
                <h3>Yêu cầu rút tiền</h3>
                <form onSubmit={handleWithdraw}>
                  <div className="form-group">
                    <label>Chủ tài khoản</label>
                    <input
                      type="text"
                      value={bankInfo.accountName}
                      onChange={e => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số tài khoản</label>
                    <input
                      type="text"
                      value={bankInfo.accountNumber}
                      onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên ngân hàng</label>
                    <input
                      type="text"
                      value={bankInfo.bankName}
                      onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số tiền muốn rút</label>
                    <input
                      type="number"
                      min={10000}
                      max={wallet.balance}
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      required
                    />
                  </div>
                  {withdrawError && <div className="withdraw-error">{withdrawError}</div>}
                  {withdrawSuccess && <div className="withdraw-success">{withdrawSuccess}</div>}
                  <div className="withdraw-actions">
                    <button type="submit" className="submit-btn" disabled={withdrawLoading}>
                      {withdrawLoading ? 'Đang gửi...' : 'Xác nhận rút tiền'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setShowWithdrawForm(false)}>
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default WalletInfo; 