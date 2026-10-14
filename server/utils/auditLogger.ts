import pool from '../config/db';

/**
 * Logs an administrative action to the database
 * @param adminId - ID of the admin performing the action
 * @param actionType - Type of action (e.g. SUSPEND_USER)
 * @param targetId - ID of the target user/driver
 * @param targetType - 'customer' or 'driver'
 * @param details - Additional information about the action
 */
export async function logAdminAction(
    adminId: number, 
    actionType: string, 
    targetId: number, 
    targetType: string, 
    details: any
): Promise<void> {
    try {
        const detailString = typeof details === 'object' ? JSON.stringify(details) : String(details);
        await pool.query(
            'INSERT INTO audit_logs (admin_id, action_type, target_id, target_type, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, actionType, targetId, targetType, detailString]
        );
        console.log(`[AUDIT] Action: ${actionType}, Admin: ${adminId}, Target: ${targetId} (${targetType})`);
    } catch (err: any) {
        console.error('[AUDIT ERROR] Failed to record log:', err);
    }
}
