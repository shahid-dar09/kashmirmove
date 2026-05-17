const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function setup() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT,
                message TEXT,
                type VARCHAR(50) DEFAULT 'admin_broadcast',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id)
            )
        `);
        console.log('Notifications table ready');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

setup();
