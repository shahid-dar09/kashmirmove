const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const pool = require('../server/config/db');

async function updateBookingsTable() {
    try {
        console.log('Starting bookings table update...');
        
        // Add stops column if it doesn't exist
        const [columns] = await pool.query('SHOW COLUMNS FROM bookings LIKE "stops"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE bookings ADD COLUMN stops JSON DEFAULT NULL AFTER drop_location');
            console.log('Added "stops" column.');
        } else {
            console.log('"stops" column already exists.');
        }

        // Add scheduled_at column if it doesn't exist
        const [schedColumns] = await pool.query('SHOW COLUMNS FROM bookings LIKE "scheduled_at"');
        if (schedColumns.length === 0) {
            await pool.query('ALTER TABLE bookings ADD COLUMN scheduled_at TIMESTAMP NULL DEFAULT NULL AFTER status');
            console.log('Added "scheduled_at" column.');
        } else {
            console.log('"scheduled_at" column already exists.');
        }

        console.log('Bookings table updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating bookings table:', error);
        process.exit(1);
    }
}

updateBookingsTable();
