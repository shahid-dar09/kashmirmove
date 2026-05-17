const mysql = require('mysql2/promise');
const path = require('path');

async function updateDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });

    console.log('Connected to database.');

    try {
        // 1. Create emergency_contacts table
        console.log('Creating emergency_contacts table...');
        await connection.query(`
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

        // 2. Add preference columns to users table
        console.log('Adding preference columns to users table...');
        // We'll add a few standard ones: silent_ride, ac_preference, music_preference
        const columns = [
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS pref_silent_ride BOOLEAN DEFAULT FALSE',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS pref_ac_needed BOOLEAN DEFAULT FALSE',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS pref_music_allowed BOOLEAN DEFAULT TRUE'
        ];

        for (const sql of columns) {
            try {
                await connection.query(sql);
            } catch (err) {
                // Ignore if column already exists
                if (err.code !== 'ER_DUP_FIELDNAME') throw err;
            }
        }

        console.log('Database Phase 2 updates completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

updateDB();
