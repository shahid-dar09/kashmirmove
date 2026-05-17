const db = require('../config/db');

// Get driver analytics: earnings over last 7 days
exports.getDriverAnalytics = async (req, res) => {
    try {
        const driverId = req.user.id; // User ID from JWT, mapped to driver
        
        // 1. Get driver info
        const [drivers] = await db.execute(
            'SELECT id FROM drivers WHERE user_id = ?',
            [driverId]
        );

        if (drivers.length === 0) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const internalDriverId = drivers[0].id;

        // 2. Fetch last 7 days of completed bookings earnings
        const [earnings] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                SUM(fare) as daily_total,
                COUNT(*) as trip_count
            FROM bookings
            WHERE driver_id = ? AND status = 'completed'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [internalDriverId]);

        // 3. Fetch summary stats
        const [stats] = await db.execute(`
            SELECT 
                rating,
                total_trips,
                earnings as total_earnings
            FROM drivers
            WHERE id = ?
        `, [internalDriverId]);

        res.json({
            daily: earnings,
            summary: stats[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};
