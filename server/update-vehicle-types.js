const mysql = require('mysql2/promise');

async function updateVehicleTypes() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    try {
        console.log('Updating vehicle types in database...');
        
        // Update vehicles table
        await connection.query("ALTER TABLE vehicles MODIFY COLUMN type ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");
        console.log('Updated vehicles table ENUM');
        
        // Update bookings table
        await connection.query("ALTER TABLE bookings MODIFY COLUMN vehicle_type ENUM('cab', 'pickup', 'truck', 'rickshaw') NOT NULL");
        console.log('Updated bookings table ENUM');
        
        console.log('Database update successful!');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await connection.end();
        process.exit();
    }
}

updateVehicleTypes();
