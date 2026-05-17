const mysql = require('mysql2');

async function updateDB() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    }).promise();

    console.log('--- Phase 3: Pilot Intelligence & Document Vault Migration ---');

    try {
        // 1. Create driver_documents table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS driver_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT NOT NULL,
                document_type ENUM('license', 'rc', 'insurance', 'other') NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created driver_documents table');

        // 2. Add is_verified flag to drivers for better state management if not exists
        const [columns] = await connection.query('SHOW COLUMNS FROM drivers LIKE "is_verified"');
        if (columns.length === 0) {
            await connection.query('ALTER TABLE drivers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
            console.log('✅ Added is_verified column to drivers');
        }

        console.log('--- Migration Completed Successfully ---');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        await connection.end();
    }
}

updateDB();
