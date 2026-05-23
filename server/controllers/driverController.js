const bcrypt = require('bcrypt');
const pool = require('../config/db');

const registerDriver = async (req, res) => {
    // Transaction needed to ensure atomicity
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { name, email, phone, password, vehicleType, vehicleNumber, model, capacity, licenseNumber } = req.body;

        // Validation
        if (!name || !email || !password || !vehicleType || !vehicleNumber || !licenseNumber) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check files
        if (!req.files || !req.files['profilePhoto'] || !req.files['idProof']) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Profile photo and ID proof are required' });
        }

        const profilePhotoPath = req.files['profilePhoto'][0].filename;
        const idProofPath = req.files['idProof'][0].filename;

        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Create User (role = driver)
        const [userResult] = await connection.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, 'driver']
        );
        const userId = userResult.insertId;

        const { area } = req.body;
        const driverArea = area || 'Srinagar';

        // 2. Create Driver (status = pending, with area)
        const [driverResult] = await connection.query(
            'INSERT INTO drivers (user_id, status, area) VALUES (?, ?, ?)',
            [userId, 'pending', driverArea]
        );
        const driverId = driverResult.insertId;

        // 3. Create Vehicle
        await connection.query(
            'INSERT INTO vehicles (driver_id, type, number, model, capacity) VALUES (?, ?, ?, ?, ?)',
            [driverId, vehicleType, vehicleNumber, model || '', capacity || '']
        );

        // 4. Create Document
        await connection.query(
            'INSERT INTO documents (driver_id, license_number, id_proof, profile_photo, status) VALUES (?, ?, ?, ?, ?)',
            [driverId, licenseNumber, idProofPath, profilePhotoPath, 'pending']
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Driver registration successful. Awaiting admin approval.',
            driverId
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};
const toggleOnlineStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { isOnline } = req.body;

        const [drivers] = await pool.query('SELECT * FROM drivers WHERE user_id = ?', [userId]);
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
        
        const driver = drivers[0];
        if (driver.status !== 'approved') return res.status(403).json({ success: false, message: 'Driver is not approved yet' });

        await pool.query('UPDATE drivers SET is_online = ? WHERE id = ?', [isOnline, driver.id]);
        res.status(200).json({ success: true, message: `Status updated to ${isOnline ? 'Online' : 'Offline'}`, isOnline });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getAvailableDrivers = async (req, res) => {
    try {
        const { type, area, lat, lng } = req.query; 

        let query = `
            SELECT d.id as driver_id, u.name, u.phone, v.type, v.model, v.capacity, d.rating, d.area, d.current_lat, d.current_lng
        `;

        let params = [];

        // If coordinates provided, calculate distance in KM
        if (lat && lng) {
            query += `, (6371 * acos(cos(radians(?)) * cos(radians(d.current_lat)) * cos(radians(d.current_lng) - radians(?)) + sin(radians(?)) * sin(radians(d.current_lat)))) AS distance `;
            params.push(lat, lng, lat);
        }

        query += `
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            JOIN vehicles v ON v.driver_id = d.id
            WHERE d.status = 'approved' AND d.is_online = 1
        `;

        if (area) {
            query += ` AND d.area = ?`;
            params.push(area);
        }

        if (type) {
            query += ` AND v.type = ?`;
            params.push(type);
        }

        if (lat && lng) {
            query += ` ORDER BY distance ASC `;
        }

        const [drivers] = await pool.query(query, params);
        res.status(200).json({ success: true, drivers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getDriverProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch basic driver info + vehicle info
        const [drivers] = await pool.query(`
            SELECT d.*, v.model as vehicle_model, v.number as vehicle_plate, v.type as vehicle_type 
            FROM drivers d
            LEFT JOIN vehicles v ON d.id = v.driver_id
            WHERE d.user_id = ?
        `, [userId]);
        
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
        
        const driver = drivers[0];
        
        // Calculate today's earnings dynamically
        const today = new Date().toISOString().split('T')[0];
        const [todayStats] = await pool.query(`
            SELECT SUM(fare) as today_earnings 
            FROM bookings 
            WHERE driver_id = ? AND status = 'completed' AND DATE(created_at) = ?
        `, [driver.id, today]);

        res.status(200).json({ 
            success: true, 
            driver: {
                ...driver,
                today_earnings: todayStats[0].today_earnings || 0
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getDriverBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
        
        const driverId = drivers[0].id;
        const [bookings] = await pool.query(`
            SELECT b.*, u.name as customer_name, u.phone as customer_phone
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.driver_id = ?
            ORDER BY b.created_at DESC
        `, [driverId]);

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateBookingStatus = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        let { bookingId, status, simulate } = req.body; // 'accepted', 'cancelled', 'completed'

        if (simulate) {
            const [testDrivers] = await connection.query('SELECT id FROM drivers WHERE status = "approved" LIMIT 1');
            if (testDrivers.length > 0) {
                await connection.query('UPDATE bookings SET status = "accepted", driver_id = ? WHERE id = ?', [testDrivers[0].id, bookingId]);
                await connection.commit();
                connection.release();
                return res.status(200).json({ success: true, message: 'Simulation successful' });
            } else {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: 'No approved drivers available for simulation' });
            }
        }

        // 1. Get booking details first
        const [bookings] = await connection.query('SELECT driver_id, fare FROM bookings WHERE id = ?', [bookingId]);
        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        const booking = bookings[0];

        // 2. Update booking status and generate OTP if accepted
        let rideOtp = null;
        if (status === 'accepted') {
            rideOtp = Math.floor(1000 + Math.random() * 9000).toString();
            await connection.query('UPDATE bookings SET status = ?, ride_otp = ? WHERE id = ?', [status, rideOtp, bookingId]);
        } else {
            await connection.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
        }

        // 3. If completed, update stats and handle payments
        if (status === 'completed') {
            // Get customer ID for this booking
            const [bookingData] = await connection.query('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
            const customerUserId = bookingData[0].user_id;

            // Deduct from customer wallet
            await connection.query(
                'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
                [booking.fare, customerUserId]
            );

            // Add to driver earnings and trips
            await connection.query(
                'UPDATE drivers SET total_trips = total_trips + 1, earnings = earnings + ? WHERE id = ?',
                [booking.fare, booking.driver_id]
            );

            // Update driver user record as well (optional but good for syncing)
            await connection.query(
                'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = (SELECT user_id FROM drivers WHERE id = ?)',
                [booking.fare, booking.driver_id]
            );
        }

        await connection.commit();

        // Notify customer via Socket.io
        const io = req.app.get('io');
        // Get customer user_id for this booking
        const [bookingData] = await connection.query('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
        if (bookingData.length > 0) {
            const customerId = bookingData[0].user_id;
            io.to(`user_${customerId}`).emit('booking_status_updated', {
                bookingId,
                status
            });
            // Also emit to booking room for real-time UI updates (e.g. closing map on completion)
            io.to(`booking_${bookingId}`).emit('booking_status_updated', {
                bookingId,
                status
            });

            // If accepted, also send the OTP notification
            if (status === 'accepted' && rideOtp) {
                // Emit to user room for sidebar notifications
                io.to(`user_${customerId}`).emit('ride_otp_issued', {
                    bookingId,
                    otp: rideOtp
                });
                // Emit to booking room for real-time card updates on WaitingRide screen
                io.to(`booking_${bookingId}`).emit('ride_otp_issued', {
                    bookingId,
                    otp: rideOtp
                });
            }
        }

        res.status(200).json({ success: true, message: `Booking ${status}` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

const startRide = async (req, res) => {
    try {
        const { bookingId, otp } = req.body;
        const driverUserId = req.user.id;

        // Get driver id
        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [driverUserId]);
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
        const driverId = drivers[0].id;

        // Check if booking exists and OTP matches
        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND driver_id = ? AND status = "accepted"',
            [bookingId, driverId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Active booking not found' });
        }

        if (String(bookings[0].ride_otp) !== String(otp)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Update status to 'started'
        await pool.query('UPDATE bookings SET status = "started" WHERE id = ?', [bookingId]);

        // Notify customer
        const io = req.app.get('io');
        // Emit to user room for sidebar/general notifications
        io.to(`user_${bookings[0].user_id}`).emit('ride_started', { bookingId });
        io.to(`user_${bookings[0].user_id}`).emit('booking_status_updated', { bookingId, status: 'started' });
        // Emit to booking room for real-time redirect in WaitingRide
        io.to(`booking_${bookingId}`).emit('ride_started', { bookingId });
        io.to(`booking_${bookingId}`).emit('booking_status_updated', { bookingId, status: 'started' });

        res.status(200).json({ success: true, message: 'Ride started successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const cancelRide = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const driverUserId = req.user.id;

        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [driverUserId]);
        const driverId = drivers[0].id;

        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND driver_id = ?',
            [bookingId, driverId]
        );

        if (bookings.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (bookings[0].status === 'completed' || bookings[0].status === 'started') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an ongoing or completed ride' });
        }

        await pool.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [bookingId]);

        const io = req.app.get('io');
        io.to(`user_${bookings[0].user_id}`).emit('booking_status_updated', { bookingId, status: 'cancelled' });

        res.status(200).json({ success: true, message: 'Ride cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const DISTRICT_CENTERS = {
    'Srinagar': { lat: 34.0837, lng: 74.7973 },
    'Anantnag': { lat: 33.7298, lng: 75.1467 },
    'Ganderbal': { lat: 34.3133, lng: 75.5667 },
    'Budgam': { lat: 34.2044, lng: 75.0044 },
    'Pulwama': { lat: 33.9244, lng: 75.3244 },
    'Kulgam': { lat: 33.6133, lng: 75.5333 },
    'Bandipora': { lat: 34.4244, lng: 74.6344 },
    'Baramulla': { lat: 34.2044, lng: 74.3444 },
    'Kupwara': { lat: 34.5244, lng: 74.2544 },
    'Shopian': { lat: 33.7144, lng: 74.8344 }
};

const updateLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { area, lat, lng } = req.body;

        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
        if (drivers.length === 0) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        let query = 'UPDATE drivers SET ';
        let params = [];
        let updates = [];

        if (area) {
            updates.push('area = ?');
            params.push(area);
            
            // Automatically update coordinates to district center if found
            const center = DISTRICT_CENTERS[area];
            if (center) {
                updates.push('current_lat = ?, current_lng = ?');
                params.push(center.lat, center.lng);
            }
        }
        
        // If specific coordinates are provided (e.g. from live GPS), they take precedence
        if (lat !== undefined && lng !== undefined) {
            // If they are 0, 0 safeguard against Null Island
            if (lat === 0 && lng === 0) {
                console.warn("DEBUG: Ignored invalid 0,0 location update request from driver API.");
            } else {
                // If coordinates were already pushed by area update above, overwrite them
                const latIdx = updates.findIndex(u => u.includes('current_lat'));
                if (latIdx !== -1) {
                    // Coordinates were already set by area, let's remove that update
                    updates.splice(latIdx, 1);
                    // Remove the two params added by the area lookup
                    // Updates list is: ['area = ?', 'current_lat = ?, current_lng = ?']
                    // params list is: [area, center.lat, center.lng]
                    // We need to keep only 'area = ?' and 'area' in params
                    params = [area];
                }
                updates.push('current_lat = ?, current_lng = ?');
                params.push(lat, lng);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No update data provided' });
        }

        query += updates.join(', ') + ' WHERE user_id = ?';
        params.push(userId);

        await pool.query(query, params);
        res.status(200).json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateVehicleInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { model, number } = req.body;

        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
        if (drivers.length === 0) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        const driverId = drivers[0].id;

        await pool.query(
            'UPDATE vehicles SET model = ?, number = ? WHERE driver_id = ?',
            [model, number, driverId]
        );

        res.status(200).json({ success: true, message: 'Vehicle info updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
        if (drivers.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
        
        const driverId = drivers[0].id;
        const [notifications] = await pool.query(
            'SELECT * FROM system_notifications WHERE driver_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [driverId]
        );

        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE system_notifications SET is_read = TRUE WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Notification acknowledged' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { 
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
};
