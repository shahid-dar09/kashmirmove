const pool = require('../config/db');

// Add a review for a completed booking
exports.addReview = async (req, res) => {
    const { bookingId, rating, comment } = req.body;
    const customerId = req.user.id;

    try {
        // 1. Verify booking exists and belongs to customer and is completed
        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND customer_id = ? AND status = ?',
            [bookingId, customerId, 'completed']
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Eligible booking not found' });
        }

        const driverId = bookings[0].driver_id;

        // 2. Check if already reviewed
        const [existing] = await pool.query('SELECT id FROM reviews WHERE booking_id = ?', [bookingId]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Already reviewed' });
        }

        // 3. Insert review
        await pool.query(
            'INSERT INTO reviews (booking_id, customer_id, driver_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [bookingId, customerId, driverId, rating, comment]
        );

        // 4. Update driver's average rating
        const [avg] = await pool.query(
            'SELECT AVG(rating) as average FROM reviews WHERE driver_id = ?',
            [driverId]
        );
        
        await pool.query('UPDATE drivers SET rating = ? WHERE id = ?', [avg[0].average, driverId]);

        res.status(201).json({ success: true, message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get reviews for a driver
exports.getDriverReviews = async (req, res) => {
    const { driverId } = req.params;
    try {
        const [reviews] = await pool.query(
            'SELECT r.*, u.name as customer_name FROM reviews r JOIN users u ON r.customer_id = u.id WHERE r.driver_id = ? ORDER BY r.created_at DESC',
            [driverId]
        );
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
