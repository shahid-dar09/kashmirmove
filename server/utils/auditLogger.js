const pool = require('../config/db');

/**
 * Logs an administrative action to the database
 * @param {number} adminId - ID of the admin performing the action
 * @param {string} actionType - Type of action (e.g. SUSPEND_USER)
 * @param {number} targetId - ID of the target user/driver
 * @param {string} targetType - 'customer' or 'driver'
 * @param {object|string} details - Additional information about the action
 */
async function logAdminAction(adminId, actionType, targetId, targetType, details) {
    try {
        const detailString = typeof details === 'object' ? JSON.stringify(details) : details;
        await pool.query(
            'INSERT INTO audit_logs (admin_id, action_type, target_id, target_type, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, actionType, targetId, targetType, detailString]
        );
        console.log(`[AUDIT] Action: ${actionType}, Admin: ${adminId}, Target: ${targetId} (${targetType})`);
    } catch (err) {
        console.error('[AUDIT ERROR] Failed to record log:', err);
        // We don't throw here to avoid breaking the main request flow, 
        // though in high-security systems we might want to.
    }
}

module.exports = { logAdminAction };
