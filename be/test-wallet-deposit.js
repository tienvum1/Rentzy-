const axios = require('axios');

// Test API wallet deposit
const testWalletDeposit = async () => {
  try {
    console.log('Testing wallet deposit API...');
    
    const response = await axios.post('http://localhost:4999/api/wallet/deposit', {
      amount: 50000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'your-auth-cookie-here' // Cần thay bằng cookie thật
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Test wallet info API
const testWalletInfo = async () => {
  try {
    console.log('Testing wallet info API...');
    
    const response = await axios.get('http://localhost:4999/api/wallet/info', {
      headers: {
        'Cookie': 'your-auth-cookie-here' // Cần thay bằng cookie thật
      }
    });
    
    console.log('Wallet info:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Chạy test
// testWalletDeposit();
// testWalletInfo();

console.log('Wallet deposit API test file created. Please update the auth cookie and run the tests.'); 