const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create', createAdmin); // Public for initial setup

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/drivers/pending', getPendingDrivers);
router.get('/drivers/all', getAllDrivers);
router.put('/drivers/:id/approve', approveDriver);

// Phase 4: User/Driver Management & Suspension
router.get('/customers/all', getAllCustomers);
router.put('/users/:userId/status', toggleUserStatus);
router.put('/drivers/:driverId/status', toggleDriverStatus);

// Phase 3.5: Document Verification
router.get('/documents/pending', getPendingDocuments);
router.get('/drivers/:driverId/documents', getDriverDocuments);
router.post('/drivers/:driverId/send-message', sendSystemMessage);
router.put('/documents/:docId/verify', verifyDocument);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
