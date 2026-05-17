const express = require('express');
console.log('Customer Routes Initializing...');
const router = express.Router();
const { addReview, getWallet, addWalletBalance, bookRide, getCustomerBookings, simulateMatch, cancelRide } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/review', protect, authorize('customer'), addReview);
router.get('/wallet', protect, getWallet);
router.post('/wallet/add', protect, addWalletBalance);
router.post('/book-ride', protect, authorize('customer'), bookRide);
router.post('/simulate-match', protect, authorize('customer'), simulateMatch);
router.get('/bookings', protect, authorize('customer'), getCustomerBookings);
router.post('/cancel-ride', protect, authorize('customer'), cancelRide);

module.exports = router;
