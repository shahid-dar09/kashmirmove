const express = require('express');
const router = express.Router();
const { registerCustomer, login, updateProfile, getProfile, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerCustomer);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
