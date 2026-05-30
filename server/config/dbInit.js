const pool = require('./db');

/**
 * Helper to check if a column exists and add it if missing
 */
async function ensureColumn(tableName, columnName, columnDefinition) {
    try {
        const [columns] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
        if (columns.length === 0) {
            console.log(`[DB Initialization] Adding column "${columnName}" to table "${tableName}"...`);
            await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
            console.log(`[DB Initialization] Column "${columnName}" successfully added.`);
        } else {
            console.log(`[DB Initialization] Column "${columnName}" already exists in table "${tableName}".`);
        }
    } catch (err) {
        console.error(`[DB Initialization] Error ensuring column "${columnName}" in "${tableName}":`, err.message);
        throw err;
    }
}

/**
 * Helper to safely modify/upgrade a column definition (e.g., ENUM values)
 */
async function modifyColumn(tableName, columnName, newDefinition) {
    try {
        console.log(`[DB Initialization] Modifying column "${columnName}" in table "${tableName}"...`);
        await pool.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${newDefinition}`);
        console.log(`[DB Initialization] Column "${columnName}" successfully modified.`);
    } catch (err) {
        console.error(`[DB Initialization] Error modifying column "${columnName}" in "${tableName}":`, err.message);
        throw err;
    }
}

/**
 * Core Database Schema Stabilization Function
 */
async function initializeDatabase() {
    console.log('🚀 [DB Initialization] Starting Database Stabilization...');

    try {
        // Test Connection
        await pool.query('SELECT 1');
        console.log('⚡ [DB Initialization] Database connection active.');

        // 1. Stabilization of 'users' Table Columns
        await ensureColumn('users', 'avatar_url', 'VARCHAR(255) DEFAULT NULL');
        await ensureColumn('users', 'status', "ENUM('active', 'suspended') DEFAULT 'active'");
        await ensureColumn('users', 'pref_silent_ride', 'BOOLEAN DEFAULT FALSE');
        await ensureColumn('users', 'pref_ac_needed', 'BOOLEAN DEFAULT FALSE');
        await ensureColumn('users', 'pref_music_allowed', 'BOOLEAN DEFAULT TRUE');

        // 2. Stabilization of 'drivers' Table Columns
        await ensureColumn('drivers', 'status', "ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending'");
        await ensureColumn('drivers', 'is_online', 'BOOLEAN DEFAULT FALSE');
        await ensureColumn('drivers', 'is_verified', 'BOOLEAN DEFAULT FALSE');
        await ensureColumn('drivers', 'area', "VARCHAR(100) DEFAULT 'Srinagar'");
        await ensureColumn('drivers', 'current_lat', 'DECIMAL(10, 8) DEFAULT NULL');
        await ensureColumn('drivers', 'current_lng', 'DECIMAL(11, 8) DEFAULT NULL');

        // Ensure status column in drivers matches updated ENUM values
        await modifyColumn('drivers', 'status', "ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending'");

        // 3. Stabilization of 'vehicles' Table Column Types
        await modifyColumn('vehicles', 'type', "ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");

        // 4. Stabilization of 'bookings' Table Columns
        await ensureColumn('bookings', 'ride_otp', 'VARCHAR(10) DEFAULT NULL');
        await ensureColumn('bookings', 'pickup_lat', 'DECIMAL(10, 8) DEFAULT NULL');
        await ensureColumn('bookings', 'pickup_lng', 'DECIMAL(11, 8) DEFAULT NULL');
        await ensureColumn('bookings', 'drop_lat', 'DECIMAL(10, 8) DEFAULT NULL');
        await ensureColumn('bookings', 'drop_lng', 'DECIMAL(11, 8) DEFAULT NULL');

        await modifyColumn('bookings', 'vehicle_type', "ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");
        await modifyColumn('bookings', 'status', "ENUM('pending', 'accepted', 'started', 'completed', 'cancelled') DEFAULT 'pending'");

        // 5. Ensure Support Tables Exist
        console.log('[DB Initialization] Verifying support tables...');

        // emergency_contacts Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS emergency_contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                relationship VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // messages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // audit_logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                target_id INT,
                target_type VARCHAR(50),
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);

        // system_notifications Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
            )
        `);

        // documents Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT NOT NULL,
                license_number VARCHAR(100) NOT NULL,
                id_proof VARCHAR(255) NOT NULL,
                profile_photo VARCHAR(255) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ [DB Initialization] Schema Stabilization Complete and Database is Ready!');
    } catch (err) {
        console.error('❌ [DB Initialization] Failed to stabilize database schema:', err.message);
        throw err;
    }
}

module.exports = { initializeDatabase };
