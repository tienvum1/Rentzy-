const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controller/auth');

router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ user_id: req.user.user_id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
});

module.exports = router;