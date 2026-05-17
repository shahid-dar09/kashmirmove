const mysql = require('mysql2/promise');

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });

    try {
        console.log('🚀 Starting Database Stabilization...');

        // 1. Fix Users table
        console.log('--- Checking users table ---');
        await connection.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS status ENUM('active', 'suspended') DEFAULT 'active'
        `).catch(e => console.log('Users update skipped or already applied.'));

        // 2. Fix Drivers table
        console.log('--- Checking drivers table ---');
        const [driverCols] = await connection.query("SHOW COLUMNS FROM drivers");
        const hasOnline = driverCols.find(c => c.Field === 'is_online');
        const hasVerified = driverCols.find(c => c.Field === 'is_verified');
        const hasArea = driverCols.find(c => c.Field === 'area');

        if (!hasOnline) await connection.query("ALTER TABLE drivers ADD COLUMN is_online BOOLEAN DEFAULT FALSE");
        if (!hasVerified) await connection.query("ALTER TABLE drivers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE");
        if (!hasArea) await connection.query("ALTER TABLE drivers ADD COLUMN area VARCHAR(100) DEFAULT 'Srinagar'");
        
        await connection.query(`
            ALTER TABLE drivers 
            ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10, 8) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11, 8) DEFAULT NULL
        `).catch(e => {});

        // Update drivers status ENUM
        await connection.query("ALTER TABLE drivers MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending'");

        // 3. Fix Vehicles table
        console.log('--- Checking vehicles table ---');
        await connection.query("ALTER TABLE vehicles MODIFY COLUMN type ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");

        // 4. Fix Bookings table
        console.log('--- Checking bookings table ---');
        await connection.query("ALTER TABLE bookings MODIFY COLUMN vehicle_type ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");
        await connection.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'accepted', 'started', 'completed', 'cancelled') DEFAULT 'pending'");
        
        await connection.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS ride_otp VARCHAR(10) DEFAULT NULL
        `).catch(e => {});

        // 5. Create Missing Tables
        console.log('--- Creating missing tables ---');
        
        // Audit Logs
        await connection.query(`
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

        // System Notifications
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
            )
        `);

        // Standardize document table if needed (but we'll stick to 'documents' in code)
        // Ensure 'documents' table exists
        await connection.query(`
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

        console.log('✅ Database Stabilization Complete!');
    } catch (err) {
        console.error('❌ Error stabilizing database:', err);
    } finally {
        await connection.end();
        process.exit();
    }
}

fixSchema();
