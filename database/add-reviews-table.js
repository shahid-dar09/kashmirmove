const pool = require('../server/config/db');

async function migrate() {
    try {
        console.log('Creating reviews table...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                customer_id INT NOT NULL,
                driver_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id),
                FOREIGN KEY (customer_id) REFERENCES users(id),
                FOREIGN KEY (driver_id) REFERENCES drivers(id)
            )
        `);

        // Add a trigger or update logic to recalculate driver rating
        // For now, we'll just handle it in the controller logic.

        console.log('Migration successful: Reviews system initialized.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
