const pool = require('../config/db');

// @desc    Get emergency contacts
// @route   GET /api/user/contacts
// @access  Private
exports.getEmergencyContacts = async (req, res) => {
    try {
        const [contacts] = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json({ success: true, contacts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add emergency contact
// @route   POST /api/user/contacts
// @access  Private
exports.addEmergencyContact = async (req, res) => {
    const { name, phone, relationship } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES (?, ?, ?, ?)',
            [req.user.id, name, phone, relationship]
        );
        res.json({ success: true, contactId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete emergency contact
// @route   DELETE /api/user/contacts/:id
// @access  Private
exports.deleteEmergencyContact = async (req, res) => {
    try {
        await pool.query('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Contact removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ride preferences
// @route   PUT /api/user/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
    const { silent_ride, ac_needed, music_allowed } = req.body;
    try {
        await pool.query(
            'UPDATE users SET pref_silent_ride = ?, pref_ac_needed = ?, pref_music_allowed = ? WHERE id = ?',
            [silent_ride ? 1 : 0, ac_needed ? 1 : 0, music_allowed ? 1 : 0, req.user.id]
        );
        res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
