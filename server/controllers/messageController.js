const db = require('../config/db');

exports.getMessageHistory = async (req, res) => {
    const { bookingId } = req.params;
    try {
        const [messages] = await db.execute(
            'SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC',
            [bookingId]
        );
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.saveMessage = async (bookingId, senderId, message) => {
    try {
        const bId = parseInt(bookingId);
        const sId = parseInt(senderId);
        
        console.log(`DEBUG: DB Save attempt - Booking: ${bId}, Sender: ${sId}`);
        
        if (isNaN(bId) || isNaN(sId)) {
            console.error('DEBUG: Invalid IDs for message save:', { bookingId, senderId });
            return false;
        }

        const [result] = await db.execute(
            'INSERT INTO messages (booking_id, sender_id, message) VALUES (?, ?, ?)',
            [bId, sId, message]
        );
        console.log('DEBUG: Message inserted with ID:', result.insertId);
        return true;
    } catch (err) {
        console.error('DEBUG: DATABASE ERROR in saveMessage:', err.message);
        return false;
    }
};
