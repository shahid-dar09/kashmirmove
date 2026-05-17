const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:bookingId', protect, messageController.getMessageHistory);

module.exports = router;
