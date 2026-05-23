const pool = require('../config/db');

const addReview = async (req, res) => {
    try {
        const { bookingId, driverId, rating, comment } = req.body;
        const customerId = req.user.id;

        // Prevent double rating for a single booking
        const [existing] = await pool.query('SELECT id FROM reviews WHERE booking_id = ?', [bookingId]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already rated this mission.' });
        }

        await pool.query(
            'INSERT INTO reviews (booking_id, customer_id, driver_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [bookingId, customerId, driverId, rating, comment]
        );

        // Update driver's average rating
        const [ratingData] = await pool.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE driver_id = ?', [driverId]);
        await pool.query('UPDATE drivers SET rating = ? WHERE id = ?', [ratingData[0].avg_rating, driverId]);

        res.status(201).json({ success: true, message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
        res.status(200).json({ success: true, balance: users[0].wallet_balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addWalletBalance = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, userId]);
        res.status(200).json({ success: true, message: 'Balance added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const bookRide = async (req, res) => {
    try {
        console.log('BOOKING REQUEST BODY:', req.body);
        const { driverId, pickupLocation, dropLocation, pickupLat, pickupLng, dropLat, dropLng, vehicleType, fare, stops, scheduledAt } = req.body;
        const userId = req.user.id;

        // Wallet check disabled as per new design
        /*
        const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
        if (users[0].wallet_balance < fare) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please add funds.' });
        }
        */

        const [result] = await pool.query(
            'INSERT INTO bookings (user_id, driver_id, pickup_location, drop_location, pickup_lat, pickup_lng, drop_lat, drop_lng, stops, vehicle_type, fare, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, driverId, pickupLocation, dropLocation, pickupLat, pickupLng, dropLat, dropLng, stops ? JSON.stringify(stops) : null, vehicleType, fare, 'pending', scheduledAt || null]
        );

        // Notify driver via Socket.io
        const io = req.app.get('io');
        // We need to find the driver's user_id to send to their specific room
        const [drivers] = await pool.query('SELECT user_id FROM drivers WHERE id = ?', [driverId]);
        if (drivers.length > 0) {
            io.to(`user_${drivers[0].user_id}`).emit('new_ride_request', {
                bookingId: result.insertId,
                pickupLocation,
                dropLocation,
                stops,
                fare,
                scheduledAt
            });
        }

        res.status(201).json({ success: true, message: 'Ride booked successfully', bookingId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getCustomerBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [bookings] = await pool.query(`
            SELECT b.*, u.name as driver_name, u.phone as driver_phone, v.number as vehicle_number, v.model,
                   r.id as review_id, r.rating as review_rating
            FROM bookings b
            LEFT JOIN drivers d ON b.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            LEFT JOIN (
                SELECT driver_id, type, MIN(number) as number, MIN(model) as model
                FROM vehicles
                GROUP BY driver_id, type
            ) v ON v.driver_id = d.id AND v.type = b.vehicle_type
            LEFT JOIN (
                SELECT booking_id, MIN(id) as id, MIN(rating) as rating
                FROM reviews
                GROUP BY booking_id
            ) r ON r.booking_id = b.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [userId]);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const simulateMatch = async (req, res) => {
    try {
        const { bookingId } = req.body;
        // Find any approved driver
        const [drivers] = await pool.query('SELECT id FROM drivers WHERE status = "approved" LIMIT 1');
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'No approved drivers available' });

        await pool.query('UPDATE bookings SET status = "accepted", driver_id = ? WHERE id = ?', [drivers[0].id, bookingId]);
        res.status(200).json({ success: true, message: 'Simulation successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const cancelRide = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (bookings.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        // Cannot cancel if ride is started or completed
        if (bookings[0].status === 'started' || bookings[0].status === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an ongoing or completed ride' });
        }

        await pool.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [bookingId]);

        // Notify driver if assigned
        if (bookings[0].driver_id) {
            const io = req.app.get('io');
            const [drivers] = await pool.query('SELECT user_id FROM drivers WHERE id = ?', [bookings[0].driver_id]);
            if (drivers.length > 0) {
                io.to(`user_${drivers[0].user_id}`).emit('booking_status_updated', { bookingId, status: 'cancelled' });
            }
        }

        res.status(200).json({ success: true, message: 'Ride cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { addReview, getWallet, addWalletBalance, bookRide, getCustomerBookings, simulateMatch, cancelRide };
