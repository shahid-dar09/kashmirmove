import express from 'express';
import { 
    sendOTP, 
    registerCustomer, 
    login, 
    updateProfile, 
    getProfile, 
    uploadAvatar, 
    getPublicStats, 
    checkExists 
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/check-exists', checkExists);
router.post('/send-otp', sendOTP);
router.post('/register', registerCustomer);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/stats', getPublicStats);

export default router;
