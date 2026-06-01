const express = require('express');
const router = express.Router();
const { sendOTP, registerCustomer, login, updateProfile, getProfile, uploadAvatar, getPublicStats } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/send-otp', sendOTP);
router.post('/register', registerCustomer);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/stats', getPublicStats);

module.exports = router;
