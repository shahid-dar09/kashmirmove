import express from 'express';
import { getMessageHistory } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:bookingId', protect, getMessageHistory);

export default router;
