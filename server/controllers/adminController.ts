import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { logAdminAction } from '../utils/auditLogger';
import { AuthRequest } from '../types';

// Temporary: Create admin endpoint (In production, disable or secure this heavily)
export const createAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, phone, password } = req.body;

        const [existingUser]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, 'admin']
        );

        res.status(201).json({ success: true, message: 'Admin created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getPendingDrivers = async (_req: Request, res: Response): Promise<any> => {
    try {
        const [drivers]: any = await pool.query(`
            SELECT d.id, d.id as driver_id, u.name, u.email, u.phone, v.type as vehicle_type, v.number as vehicle_number,
                   doc.license_number, doc.id_proof, doc.profile_photo, d.status
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            JOIN vehicles v ON v.driver_id = d.id
            JOIN documents doc ON doc.driver_id = d.id
            WHERE d.status = 'pending'
        `);

        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const approveDriver = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await pool.query('UPDATE drivers SET status = ? WHERE id = ?', [newStatus, id]);
        await pool.query('UPDATE documents SET status = ? WHERE driver_id = ?', [newStatus, id]);
        await pool.query('UPDATE driver_documents SET status = ? WHERE driver_id = ?', [newStatus, id]);

        res.status(200).json({ success: true, message: `Driver ${newStatus} successfully` });

        // Log the action
        if (req.user?.id) {
            await logAdminAction(
                req.user.id,
                action === 'approve' ? 'DRIVER_APPROVED' : 'DRIVER_REJECTED',
                Number(id),
                'driver',
                { action }
            );
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllDrivers = async (_req: Request, res: Response): Promise<any> => {
    try {
        const [drivers]: any = await pool.query(`
            SELECT d.id as driver_id, u.name, u.email, u.phone, v.type as vehicle_type, v.number as vehicle_number, v.model as vehicle_model,
                   doc.license_number, d.status, d.is_online, d.rating, d.total_trips, d.earnings, u.avatar_url
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            JOIN vehicles v ON v.driver_id = d.id
            LEFT JOIN documents doc ON doc.driver_id = d.id
        `);

        console.log('API Drivers Data Sample:', drivers[0]);
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAdminStats = async (_req: Request, res: Response): Promise<any> => {
    try {
        const [usersCount]: any = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
        const [driversCount]: any = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'approved'");
        const [pendingCount]: any = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'pending'");
        const [revenueRes]: any = await pool.query("SELECT SUM(fare) as total FROM bookings WHERE status = 'completed'");
        const [tripsCount]: any = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'");

        res.status(200).json({
            success: true,
            stats: {
                total_users: usersCount[0].count,
                active_drivers: driversCount[0].count,
                pending_approvals: pendingCount[0].count,
                total_revenue: revenueRes[0].total || 0,
                total_trips: tripsCount[0].count
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getPendingDocuments = async (_req: Request, res: Response): Promise<any> => {
    try {
        console.log('Fetching pending documents...');
        const [docs]: any = await pool.query(`
            SELECT doc.*, u.name as driver_name, u.email as driver_email 
            FROM driver_documents doc
            LEFT JOIN drivers d ON doc.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE doc.status = 'pending'
        `);
        console.log('Found document sets:', docs.length);
        res.json({ success: true, data: docs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const verifyDocument = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { docId } = req.params;
        const { status } = req.body; 
        console.log(`Verifying Doc Set ${docId} to status: ${status}`);

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // 1. Update document status
        await pool.execute('UPDATE driver_documents SET status = ? WHERE id = ?', [status, docId]);

        // 2. If approved, approve the driver as well
        if (status === 'approved') {
            const [docInfo]: any = await pool.query('SELECT driver_id FROM driver_documents WHERE id = ?', [docId]);
            if (docInfo.length > 0) {
                const driverId = docInfo[0].driver_id;
                await pool.execute('UPDATE drivers SET is_verified = TRUE, status = "approved" WHERE id = ?', [driverId]);
                console.log(`Driver ${driverId} fully verified!`);
            }
        }

        res.json({ success: true, message: `Documents ${status} successfully` });

        // Log the action
        if (req.user?.id) {
            await logAdminAction(
                req.user.id,
                status === 'approved' ? 'DOCUMENT_APPROVE' : 'DOCUMENT_REJECT',
                Number(docId),
                'driver',
                { status, docId }
            );
        }
    } catch (err) {
        console.error('Verify Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDriverDocuments = async (req: Request, res: Response): Promise<any> => {
    try {
        const { driverId } = req.params;
        const [docs]: any = await pool.query(
            'SELECT * FROM driver_documents WHERE driver_id = ?',
            [driverId]
        );
        res.json({ success: true, data: docs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const sendSystemMessage = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { driverId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        await pool.query(
            'INSERT INTO system_notifications (driver_id, message) VALUES (?, ?)',
            [driverId, message]
        );

        res.json({ success: true, message: 'Priority command dispatched successfully' });

        // Log the action
        if (req.user?.id) {
            await logAdminAction(
                req.user.id,
                'SYSTEM_MESSAGE',
                Number(driverId),
                'driver',
                { message }
            );
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllCustomers = async (_req: Request, res: Response): Promise<any> => {
    try {
        const [customers]: any = await pool.query(`
            SELECT id, name, email, phone, wallet_balance, avatar_url, status, created_at
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // 'active' or 'suspended'

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        res.json({ success: true, message: `User account ${status} successfully` });

        // Log the action
        if (req.user?.id) {
            await logAdminAction(
                req.user.id,
                status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
                Number(userId),
                'customer',
                { status }
            );
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const toggleDriverStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { driverId } = req.params;
        const { status } = req.body; // 'approved', 'suspended', etc.

        if (!['approved', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await pool.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
        res.json({ success: true, message: `Driver status updated to ${status}` });

        // Log the action
        if (req.user?.id) {
            await logAdminAction(
                req.user.id,
                status === 'suspended' ? 'SUSPEND_DRIVER' : 'ACTIVATE_DRIVER',
                Number(driverId),
                'driver',
                { status }
            );
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAuditLogs = async (_req: Request, res: Response): Promise<any> => {
    try {
        const [logs]: any = await pool.query(`
            SELECT 
                al.*, 
                al.action_type as action,
                u.name as admin_name,
                COALESCE(
                    target_user.name, 
                    target_driver_user.name, 
                    CONCAT(UPPER(LEFT(al.target_type, 1)), SUBSTRING(al.target_type, 2), ' #', al.target_id)
                ) as target_name
            FROM audit_logs al
            JOIN users u ON al.admin_id = u.id
            LEFT JOIN users target_user ON al.target_type = 'customer' AND al.target_id = target_user.id
            LEFT JOIN drivers d ON al.target_type = 'driver' AND al.target_id = d.id
            LEFT JOIN users target_driver_user ON d.user_id = target_driver_user.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
