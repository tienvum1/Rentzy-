const express = require('express');
const router = express.Router();
const { 
    createMoMoPayment, 
    verifyMoMoPayment, 
    createRentalPayment,
    checkRentalPayment 
} = require('../controller/paymentController');

// ... existing routes ...

// Route for checking rental payment
router.get('/check-rental-payment', checkRentalPayment);

// ... existing routes ...

module.exports = router; 