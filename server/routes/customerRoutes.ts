import express from 'express';
import { 
    addReview, 
    getWallet, 
    addWalletBalance, 
    bookRide, 
    getCustomerBookings, 
    simulateMatch, 
    cancelRide 
} from '../controllers/customerController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/review', protect, authorize('customer'), addReview);
router.get('/wallet', protect, getWallet);
router.post('/wallet/add', protect, addWalletBalance);
router.post('/book-ride', protect, authorize('customer'), bookRide);
router.post('/simulate-match', protect, authorize('customer'), simulateMatch);
router.get('/bookings', protect, authorize('customer'), getCustomerBookings);
router.post('/cancel-ride', protect, authorize('customer'), cancelRide);

export default router;
