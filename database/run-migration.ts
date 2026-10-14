// Run this script to create the verification_otps table
// Usage: npx tsx database/run-migration.ts

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './server/.env' });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'kashmirmove',
    });

    console.log('✅ Connected to database');

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS verification_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            otp VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        )
    `);

    console.log('✅ verification_otps table created (or already exists)');
    await connection.end();
    console.log('✅ Migration complete!');
}

runMigration().catch((err: any) => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
