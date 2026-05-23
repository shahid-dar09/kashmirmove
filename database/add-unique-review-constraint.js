const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    try {
        console.log('Adding UNIQUE constraint to reviews.booking_id...');
        await connection.query('ALTER TABLE reviews ADD CONSTRAINT unique_booking UNIQUE (booking_id)');
        console.log('UNIQUE constraint added successfully.');
    } catch (err) {
        console.error('Error adding constraint:', err.message);
    }

    process.exit();
}
migrate();
