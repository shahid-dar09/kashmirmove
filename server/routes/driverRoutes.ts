import express from 'express';
import { 
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
} from '../controllers/driverController';
import upload from '../middleware/uploadMiddleware';
import docUpload from '../middleware/documentMiddleware';
import { protect, authorize } from '../middleware/authMiddleware';
import { getDriverAnalytics } from '../controllers/analyticsController';
import { uploadDocument, getDocuments } from '../controllers/documentController';

const router = express.Router();

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

// Analytics & Documents
router.get('/notifications', protect, authorize('driver'), getNotifications);
router.put('/notifications/:id/read', protect, authorize('driver'), markNotificationRead);
router.get('/analytics', protect, authorize('driver'), getDriverAnalytics);
router.get('/documents', protect, authorize('driver'), getDocuments);
router.post('/documents', protect, authorize('driver'), docUpload.single('document'), uploadDocument);

export default router;
