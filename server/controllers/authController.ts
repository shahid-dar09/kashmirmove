import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { uploadToCloudinary } from '../utils/cloudinary';
import { generateOTP, sendOTPEmail } from '../utils/mailer';
import { AuthRequest } from '../types';

const generateToken = (id: number, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// ─── Send Email OTP ───────────────────────────────────────────────────────────
export const sendOTP = async (req: Request, res: Response): Promise<any> => {
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
        const [existingUser]: [any[], any] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
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

    } catch (error: any) {
        console.error('sendOTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to send verification email. Please try again.' 
        });
    }
};

// ─── Register Customer (with OTP verification) ────────────────────────────────
export const registerCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, phone, password, otp } = req.body;

        if (!name || !email || !phone || !password || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields including the verification code' });
        }

        // Verify OTP
        const [otpRecords]: [any[], any] = await pool.query(
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

        // Check email or phone not taken (race condition guard)
        const [existingEmail]: [any[], any] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
        }

        const [existingPhone]: [any[], any] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this phone number already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result]: any = await pool.query(
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
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const cleanEmail = email ? email.trim().toLowerCase() : '';
        console.log(`[Auth] Attempting login for email: "${cleanEmail}"`);

        const [users]: [any[], any] = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', [cleanEmail]);
        
        if (users.length === 0) {
            console.log(`[Auth] Login failed: No user found with email "${cleanEmail}"`);
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
            console.log(`[Auth] Login failed: Password mismatch for user "${cleanEmail}"`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // If user is a driver, check if they are approved
        if (user.role === 'driver') {
            const [drivers]: [any[], any] = await pool.query('SELECT status FROM drivers WHERE user_id = ?', [user.id]);
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

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { name, phone, password } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.query('UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?', [name, phone, hashedPassword, userId]);
        } else {
            await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, userId]);
        }

        const [users]: [any[], any] = await pool.query('SELECT id, name, email, phone, role, avatar_url, pref_silent_ride, pref_ac_needed, pref_music_allowed FROM users WHERE id = ?', [userId]);

        res.status(200).json({ success: true, message: 'Profile updated successfully', user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

        const [users]: [any[], any] = await pool.query('SELECT id, name, email, phone, role, avatar_url, pref_silent_ride, pref_ac_needed, pref_music_allowed FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
        res.status(200).json({ success: true, user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
        
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

        const [users]: [any[], any] = await pool.query('SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?', [userId]);

        res.status(200).json({ success: true, message: 'Avatar updated successfully', user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error while uploading avatar' });
    }
};

export const getPublicStats = async (_req: Request, res: Response): Promise<any> => {
    try {
        // 1. Get approved drivers count grouped by area
        const [driverCounts]: [any[], any] = await pool.query(
            "SELECT area, COUNT(*) as count FROM drivers WHERE status = 'approved' GROUP BY area"
        );
        
        const driversByArea: Record<string, number> = {};
        driverCounts.forEach(row => {
            if (row.area) {
                driversByArea[row.area] = row.count;
            }
        });

        // 2. Get total completed bookings count
        const [bookingCountResult]: [any[], any] = await pool.query(
            "SELECT COUNT(*) as total FROM bookings WHERE status = 'completed'"
        );
        const completedBookings = bookingCountResult[0].total;

        // 3. Get total approved drivers count
        const [totalDriversResult]: [any[], any] = await pool.query(
            "SELECT COUNT(*) as total FROM drivers WHERE status = 'approved'"
        );
        const totalApprovedDrivers = totalDriversResult[0].total;

        // 4. Get average rating of approved drivers
        const [avgRatingResult]: [any[], any] = await pool.query(
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

export const checkExists = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }

        if (email) {
            const [emailCheck]: [any[], any] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (emailCheck.length > 0) {
                return res.status(200).json({ 
                    success: true, 
                    exists: true, 
                    field: 'email',
                    message: 'An account with this email already exists. Please log in.' 
                });
            }
        }

        if (phone) {
            const [phoneCheck]: [any[], any] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
            if (phoneCheck.length > 0) {
                return res.status(200).json({ 
                    success: true, 
                    exists: true, 
                    field: 'phone',
                    message: 'An account with this phone number already exists.' 
                });
            }
        }

        return res.status(200).json({ success: true, exists: false });
    } catch (error) {
        console.error('checkExists error:', error);
        res.status(500).json({ success: false, message: 'Server error during check' });
    }
};
