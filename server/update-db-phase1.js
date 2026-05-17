require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDb() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kashmirmove'
    });

    try {
        console.log('Adding avatar_url to users table...');
        try {
            await pool.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL');
            console.log('✅ Added avatar_url column successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⏭️ Column avatar_url already exists.');
            } else {
                throw err;
            }
        }

        console.log('Creating saved_locations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS saved_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                address VARCHAR(255) NOT NULL,
                lat DECIMAL(10, 8) NOT NULL,
                lng DECIMAL(11, 8) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created saved_locations table successfully.');

        console.log('🎉 Database update complete!');
    } catch (error) {
        console.error('❌ Database update failed:', error);
    } finally {
        await pool.end();
    }
}

updateDb();
