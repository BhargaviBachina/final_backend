const express = require('express');
const { register, login, forgotPassword, resetPassword, getProfile } = require('./auth.controller');
const { validateRegister, validateLogin, validateResetPassword } = require('./dto/auth.dto');
const { verifyToken } = require('../../helpers/authMiddleware');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
