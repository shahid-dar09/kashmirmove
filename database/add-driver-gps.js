const pool = require('../server/config/db');

async function migrate() {
    try {
        console.log('Adding GPS coordinates to drivers table...');
        
        // 1. Add columns
        await pool.query(`
            ALTER TABLE drivers 
            ADD COLUMN current_lat DECIMAL(10, 8) DEFAULT 34.0837,
            ADD COLUMN current_lng DECIMAL(10, 8) DEFAULT 74.7973
        `);

        // 2. Update existing drivers with slightly offset coordinates based on their area
        // This makes the 'Fastest' calculation real and testable
        const [drivers] = await pool.query('SELECT id, area FROM drivers');
        
        const DISTRICT_COORDS = {
            'Srinagar':  [34.0837, 74.7973],
            'Budgam':    [34.0200, 74.7200],
            'Ganderbal': [34.2167, 74.7667],
            'Anantnag':  [33.7300, 75.1500],
            'Baramulla': [34.2000, 74.3500]
        };

        for (const driver of drivers) {
            const base = DISTRICT_COORDS[driver.area] || [34.0837, 74.7973];
            // Add a random offset of up to ~2km
            const lat = base[0] + (Math.random() - 0.5) * 0.02;
            const lng = base[1] + (Math.random() - 0.5) * 0.02;
            
            await pool.query('UPDATE drivers SET current_lat = ?, current_lng = ? WHERE id = ?', [lat, lng, driver.id]);
        }

        console.log('Migration successful: GPS tracking initialized for all pilots.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
