const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kashmirmove'
  });

  console.log('Connected to database.');

  try {
    // 1. Add ride_otp column
    await conn.execute(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS ride_otp VARCHAR(6) DEFAULT NULL
    `);
    console.log('✓ ride_otp column added (or already exists)');

    // 2. Add 'started' to the status ENUM
    // MySQL requires rebuilding the ENUM definition fully
    await conn.execute(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('pending','accepted','started','completed','cancelled') DEFAULT 'pending'
    `);
    console.log('✓ status ENUM updated to include "started"');

  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await conn.end();
    console.log('Migration complete.');
  }
}

migrate();
