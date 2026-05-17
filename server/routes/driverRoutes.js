const express = require('express');
const router = express.Router();
const { 
    registerDriver, 
    toggleOnlineStatus, 
    getAvailableDrivers, 
    getDriverProfile, 
    getDriverBookings, 
    updateBookingStatus, 
    startRide,
    cancelRide,
    updateLocation, 
    updateVehicleInfo,
    getNotifications,
    markNotificationRead 
} = require('../controllers/driverController');
const upload = require('../middleware/uploadMiddleware');
const docUpload = require('../middleware/documentMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getDriverAnalytics } = require('../controllers/analyticsController');
const { uploadDocument, getDocuments } = require('../controllers/documentController');

router.post('/register', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]), registerDriver);

router.get('/available', protect, getAvailableDrivers);
router.put('/status', protect, authorize('driver'), toggleOnlineStatus);
router.put('/location', protect, authorize('driver'), updateLocation);
router.put('/vehicle', protect, authorize('driver'), updateVehicleInfo);
router.get('/profile', protect, authorize('driver'), getDriverProfile);
router.get('/bookings', protect, authorize('driver'), getDriverBookings);
router.put('/booking-status', protect, authorize('driver'), updateBookingStatus);
router.post('/start-ride', protect, authorize('driver'), startRide);
router.post('/cancel-ride', protect, authorize('driver'), cancelRide);

// Phase 3: Analytics & Documents
router.get('/notifications', protect, authorize('driver'), getNotifications);
router.put('/notifications/:id/read', protect, authorize('driver'), markNotificationRead);
router.get('/analytics', protect, authorize('driver'), getDriverAnalytics);
router.get('/documents', protect, authorize('driver'), getDocuments);
router.post('/documents', protect, authorize('driver'), docUpload.single('document'), uploadDocument);

module.exports = router;
