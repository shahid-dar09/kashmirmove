const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Adding coordinate columns to bookings table...');
        
        await pool.query(`
            ALTER TABLE bookings 
            ADD COLUMN pickup_lat DECIMAL(10, 8),
            ADD COLUMN pickup_lng DECIMAL(11, 8),
            ADD COLUMN drop_lat DECIMAL(10, 8),
            ADD COLUMN drop_lng DECIMAL(11, 8)
        `);
        
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
