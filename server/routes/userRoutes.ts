import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getEmergencyContacts,
    addEmergencyContact,
    deleteEmergencyContact,
    updatePreferences
} from '../controllers/userController';

const router = express.Router();

router.use(protect);

router.get('/contacts', getEmergencyContacts);
router.post('/contacts', addEmergencyContact);
router.delete('/contacts/:id', deleteEmergencyContact);
router.put('/preferences', updatePreferences);

export default router;
