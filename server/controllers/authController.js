const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { generateOTP, sendOTPEmail } = require('../utils/mailer');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// ─── Send Email OTP ───────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }

        // Check if email already registered
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
        }

        // Delete any previous OTPs for this email
        await pool.query('DELETE FROM verification_otps WHERE email = ?', [email]);

        // Generate OTP and set 10-minute expiry
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            'INSERT INTO verification_otps (email, otp, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt]
        );

        // Send email
        await sendOTPEmail(email, otp, name || 'Valued User');

        res.status(200).json({
            success: true,
            message: `Verification code sent to ${email}. Please check your inbox.`
        });

    } catch (error) {
        console.error('sendOTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
    }
};

// ─── Register Customer (with OTP verification) ────────────────────────────────
const registerCustomer = async (req, res) => {
    try {
        const { name, email, phone, password, otp } = req.body;

        if (!name || !email || !phone || !password || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields including the verification code' });
        }

        // Verify OTP
        const [otpRecords] = await pool.query(
            'SELECT * FROM verification_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
            [email]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({ success: false, message: 'No verification code found for this email. Please request a new one.' });
        }

        const otpRecord = otpRecords[0];

        if (new Date() > new Date(otpRecord.expires_at)) {
            await pool.query('DELETE FROM verification_otps WHERE email = ?', [email]);
            return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
        }

        if (otpRecord.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect verification code. Please try again.' });
        }

        // OTP is valid — clean it up
        await pool.query('DELETE FROM verification_otps WHERE email = ?', [email]);

        // Check email not taken (race condition guard)
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, 'customer']
        );

        const token = generateToken(result.insertId, 'customer');

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to KashmirMove.',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                role: 'customer'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        // Global status check (Suspension)
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been suspended for rule violations. Please contact support.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // If user is a driver, check if they are approved
        if (user.role === 'driver') {
            const [drivers] = await pool.query('SELECT status FROM drivers WHERE user_id = ?', [user.id]);
            if (drivers.length > 0 && drivers[0].status !== 'approved') {
                const statusMsg = drivers[0].status === 'suspended' 
                    ? 'Your driver account is suspended. Contact admin.' 
                    : `Account is ${drivers[0].status}. Please wait for admin approval.`;
                return res.status(403).json({ success: false, message: statusMsg });
            }
        }

        const token = generateToken(user.id, user.role);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const userId = req.user.id;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.query('UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?', [name, phone, hashedPassword, userId]);
        } else {
            await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, userId]);
        }

        const [users] = await pool.query('SELECT id, name, email, phone, role, avatar_url, pref_silent_ride, pref_ac_needed, pref_music_allowed FROM users WHERE id = ?', [userId]);

        res.status(200).json({ success: true, message: 'Profile updated successfully', user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query('SELECT id, name, email, phone, role, avatar_url, pref_silent_ride, pref_ac_needed, pref_music_allowed FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
        res.status(200).json({ success: true, user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        let avatarUrl = `/uploads/${req.file.filename}`;

        // Upload to Cloudinary if configured
        const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'avatars');
        if (cloudinaryUrl) {
            avatarUrl = cloudinaryUrl;
        }

        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);

        const [users] = await pool.query('SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?', [userId]);

        res.status(200).json({ success: true, message: 'Avatar updated successfully', user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error while uploading avatar' });
    }
};

const getPublicStats = async (req, res) => {
    try {
        // 1. Get approved drivers count grouped by area
        const [driverCounts] = await pool.query(
            "SELECT area, COUNT(*) as count FROM drivers WHERE status = 'approved' GROUP BY area"
        );
        
        // Convert to an object: { 'Srinagar': 5, 'Budgam': 2 }
        const driversByArea = {};
        driverCounts.forEach(row => {
            if (row.area) {
                // Ensure proper case-insensitive matching or exact string key match
                driversByArea[row.area] = row.count;
            }
        });

        // 2. Get total completed bookings count
        const [bookingCountResult] = await pool.query(
            "SELECT COUNT(*) as total FROM bookings WHERE status = 'completed'"
        );
        const completedBookings = bookingCountResult[0].total;

        // 3. Get total approved drivers count
        const [totalDriversResult] = await pool.query(
            "SELECT COUNT(*) as total FROM drivers WHERE status = 'approved'"
        );
        const totalApprovedDrivers = totalDriversResult[0].total;

        // 4. Get average rating of approved drivers
        const [avgRatingResult] = await pool.query(
            "SELECT AVG(rating) as avgRating FROM drivers WHERE status = 'approved' AND rating > 0"
        );
        const avgRating = avgRatingResult[0].avgRating ? parseFloat(avgRatingResult[0].avgRating).toFixed(2) : null;

        res.status(200).json({
            success: true,
            stats: {
                driversByArea,
                completedBookings,
                totalApprovedDrivers,
                avgRating
            }
        });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        res.status(200).json({
            success: false,
            message: 'Failed to fetch database stats, using offline defaults',
            stats: {
                driversByArea: {},
                completedBookings: 0,
                totalApprovedDrivers: 0,
                avgRating: null
            }
        });
    }
};

module.exports = { sendOTP, registerCustomer, login, updateProfile, getProfile, uploadAvatar, getPublicStats };
