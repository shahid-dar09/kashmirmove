const express = require('express');
const router = express.Router();
const { addReview, getDriverReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addReview);
router.get('/driver/:driverId', getDriverReviews);

module.exports = router;
