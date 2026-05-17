const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getEmergencyContacts,
    addEmergencyContact,
    deleteEmergencyContact,
    updatePreferences
} = require('../controllers/userController');

router.use(protect);

router.get('/contacts', getEmergencyContacts);
router.post('/contacts', addEmergencyContact);
router.delete('/contacts/:id', deleteEmergencyContact);
router.put('/preferences', updatePreferences);

module.exports = router;
