
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './WalletInfo.css';

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
    <div className="profile-main-content">
      <div className="wallet-header">
        <h2>Ví điện tử của tôi</h2>
        <p className="wallet-subtitle">Quản lý số dư và thực hiện giao dịch</p>
      </div>

      {/* Global Success Message */}
      {globalSuccessMessage && (
        <div className="alert alert-success global-success">
          <span className="alert-icon">✅</span>
          <div>{globalSuccessMessage}</div>
        </div>
      )}

      {loading ? (
        <div className="wallet-loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin ví...</p>
        </div>
      ) : error ? (
        <div className="wallet-error-container">
          <div className="error-icon">⚠️</div>
          <h3>Không thể tải thông tin ví</h3>
          <p>{error}</p>
        </div>
      ) : wallet ? (
        <div className="wallet-dashboard">
          {/* Main Balance Card */}
          <div className="balance-card">
            <div className="balance-header">
              <div className="balance-icon">💰</div>
              <div className="balance-info">
                <h3>Số dư hiện tại</h3>
                <div className="balance-amount">
                  {wallet.balance.toLocaleString('vi-VN')} {wallet.currency}
                </div>
              </div>
            </div>
            <div className="balance-actions">
              <button 
                className="deposit-btn primary"
                onClick={() => setShowDepositForm(true)}
              >
                <span className="btn-icon">💳</span>
                Nạp tiền
              </button>
              <button 
                className="withdraw-btn secondary"
                onClick={() => setShowWithdrawForm(true)}
              >
                <span className="btn-icon">📤</span>
                Rút tiền
              </button>
            </div>
          </div>

          {/* Wallet Details */}
          <div className="wallet-details-grid">
            <div className="detail-card">
              <div className="detail-icon">📊</div>
              <div className="detail-content">
                <h4>Trạng thái</h4>
                <p className={wallet.status === 'active' ? 'status-active' : 'status-inactive'}>
                  {wallet.status === 'active' ? 'Đang hoạt động' : wallet.status}
                </p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">📅</div>
              <div className="detail-content">
                <h4>Ngày tạo ví</h4>
                <p>{new Date(wallet.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">🔄</div>
              <div className="detail-content">
                <h4>Cập nhật lần cuối</h4>
                <p>{new Date(wallet.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="wallet-error-container">
          <div className="error-icon">❌</div>
          <h3>Không tìm thấy ví</h3>
          <p>Vui lòng liên hệ hỗ trợ để được trợ giúp.</p>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositForm && (
        <div className="modal-overlay" onClick={() => setShowDepositForm(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nạp tiền vào ví</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDepositForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleDeposit} className="withdraw-form">
              <div className="form-group">
                <label>Số tiền muốn nạp</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    min={10000}
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    required
                  />
                  <span className="currency-symbol">VND</span>
                </div>
                <small className="amount-limit">
                  Tối thiểu: 10,000 VND
                </small>
              </div>

              {depositError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  {depositError}
                </div>
              )}
              
              {depositSuccess && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  {depositSuccess}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowDepositForm(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={depositLoading}
                >
                  {depositLoading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận nạp tiền'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawForm && (
        <div className="modal-overlay" onClick={() => setShowWithdrawForm(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yêu cầu rút tiền</h3>
              <button 
                className="close-btn"
                onClick={() => setShowWithdrawForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleWithdraw} className="withdraw-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Chủ tài khoản</label>
                  <input
                    type="text"
                    value={bankInfo.accountName}
                    onChange={e => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                    placeholder="Nhập tên chủ tài khoản"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số tài khoản</label>
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    placeholder="Nhập số tài khoản"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tên ngân hàng</label>
                  <input
                    type="text"
                    value={bankInfo.bankName}
                    onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    placeholder="Nhập tên ngân hàng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số tiền muốn rút</label>
                  <div className="amount-input-wrapper">
                    <input
                      type="number"
                      min={10000}
                      max={wallet?.balance || 0}
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                      required
                    />
                    <span className="currency-symbol">VND</span>
                  </div>
                  <small className="amount-limit">
                    Tối thiểu: 10,000 VND | Tối đa: {wallet?.balance?.toLocaleString('vi-VN')} VND
                  </small>
                </div>
              </div>

              {withdrawError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  {withdrawError}
                </div>
              )}
              
              {withdrawSuccess && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <div style={{ whiteSpace: 'pre-line' }}>{withdrawSuccess}</div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowWithdrawForm(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận rút tiền'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletInfo; 