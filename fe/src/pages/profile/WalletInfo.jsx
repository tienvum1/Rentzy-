import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './WalletInfo.css';
import { FaMoneyBillWave, FaUniversity, FaUser, FaCheckCircle } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import ProfileSidebar from './ProfileSidebar';

const WalletInfo = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountName: '',
    accountNumber: '',
    bankName: ''
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState('');

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('Global success message changed:', globalSuccessMessage);
  }, [globalSuccessMessage]);

  useEffect(() => {
    console.log('Withdraw success message changed:', withdrawSuccess);
  }, [withdrawSuccess]);

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

  // Xử lý callback từ MoMo
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const amount = urlParams.get('amount');
    const message = urlParams.get('message');

    if (status === 'success' && amount) {
      setDepositSuccess(`Nạp tiền thành công! Số tiền: ${parseInt(amount).toLocaleString('vi-VN')} VND`);
      // Refresh wallet balance
      const fetchWallet = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`, { withCredentials: true });
          setWallet(res.data.wallet);
        } catch (err) {
          console.error('Error refreshing wallet:', err);
        }
      };
      fetchWallet();
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      setDepositError(message || 'Thanh toán thất bại');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    console.log('Starting withdraw process...');
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);
    try {
      const requestData = {
        ...bankInfo,
        amount: withdrawAmount
      };
      console.log('Sending withdraw request with data:', requestData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/withdraw`,
        requestData,
        { withCredentials: true }
      );
      
      console.log('Withdraw response:', response.data);
      
      if (response.data.success) {
        const successMessage = `✅ Rút tiền thành công! Quý khách đợi trong giây lát...`;
        
        console.log('Setting success message:', successMessage);
        setWithdrawSuccess(successMessage);
        setGlobalSuccessMessage(successMessage);
        setWithdrawAmount('');
        setBankInfo({ accountName: '', accountNumber: '', bankName: '' });
        
        // Refresh wallet balance
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/info`, { withCredentials: true });
        setWallet(res.data.wallet);
        
        // Đóng modal sau 2 giây
        setTimeout(() => {
          console.log('Closing modal after 2 seconds');
          setShowWithdrawForm(false);
          setWithdrawSuccess(''); // Clear success message after closing modal
        }, 2000);
        
        // Clear global message after 5 seconds
        setTimeout(() => {
          console.log('Clearing global message after 5 seconds');
          setGlobalSuccessMessage('');
        }, 5000);
      } else {
        console.log('Withdraw failed:', response.data.message);
        setWithdrawError(response.data.message || 'Gửi yêu cầu thất bại');
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      setWithdrawError(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');
    setDepositLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallet/deposit`,
        {
          amount: depositAmount
        },
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.paymentUrl) {
        // Redirect đến trang thanh toán MoMo
        window.location.href = response.data.paymentUrl;
      } else {
        setDepositError('Không thể tạo yêu cầu thanh toán');
      }
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setDepositLoading(false);
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