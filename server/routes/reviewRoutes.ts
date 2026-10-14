import express from 'express';
import { addReview, getDriverReviews } from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/add', protect, addReview);
router.get('/driver/:driverId', getDriverReviews);

export default router;
