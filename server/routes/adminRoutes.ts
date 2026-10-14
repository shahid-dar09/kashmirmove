import express from 'express';
import { 
    createAdmin, 
    getPendingDrivers, 
    approveDriver, 
    getAllDrivers, 
    getAdminStats, 
    getPendingDocuments, 
    verifyDocument, 
    getDriverDocuments, 
    sendSystemMessage, 
    getAllCustomers, 
    toggleUserStatus, 
    toggleDriverStatus, 
    getAuditLogs 
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', createAdmin); // Public for initial setup

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/drivers/pending', getPendingDrivers);
router.get('/drivers/all', getAllDrivers);
router.put('/drivers/:id/approve', approveDriver);

// User/Driver Management & Suspension
router.get('/customers/all', getAllCustomers);
router.put('/users/:userId/status', toggleUserStatus);
router.put('/drivers/:driverId/status', toggleDriverStatus);

// Document Verification
router.get('/documents/pending', getPendingDocuments);
router.get('/drivers/:driverId/documents', getDriverDocuments);
router.post('/drivers/:driverId/send-message', sendSystemMessage);
router.put('/documents/:docId/verify', verifyDocument);
router.get('/audit-logs', getAuditLogs);

export default router;
