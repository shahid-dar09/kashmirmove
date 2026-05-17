// Run this ONCE to add area and is_online columns to the drivers table
// Usage: node server/migrate-location.js

const pool = require('./config/db');

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('Running location migration...');

        // Add is_online column if it doesn't exist
        await connection.query(`
            ALTER TABLE drivers 
            ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0
        `).catch(() => {
            // MySQL < 8.0 doesn't support IF NOT EXISTS on ALTER — ignore if already exists
        });

        // Add area column if it doesn't exist
        await connection.query(`
            ALTER TABLE drivers 
            ADD COLUMN IF NOT EXISTS area VARCHAR(100) DEFAULT 'Srinagar'
        `).catch(() => {});

        // Try the safe alternative for older MySQL versions
        try {
            await connection.query(`ALTER TABLE drivers ADD COLUMN is_online TINYINT(1) DEFAULT 0`);
            console.log('✅ Added is_online column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  is_online column already exists — skipping');
            } else { throw e; }
        }

        try {
            await connection.query(`ALTER TABLE drivers ADD COLUMN area VARCHAR(100) DEFAULT 'Srinagar'`);
            console.log('✅ Added area column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  area column already exists — skipping');
            } else { throw e; }
        }

        // Set default area for any existing drivers that have NULL
        await connection.query(`UPDATE drivers SET area = 'Srinagar' WHERE area IS NULL`);
        console.log('✅ Set default area for existing drivers');

        const [rows] = await connection.query('SELECT id, user_id, area, is_online FROM drivers');
        console.log('\n📋 Current drivers table:');
        console.table(rows);
        console.log('\n✅ Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
