const mysql = require('mysql2/promise');

async function fixDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    await connection.query("UPDATE bookings SET status = 'cancelled' WHERE status = ''");
    console.log('Fixed invalid ENUMs in bookings table');
    process.exit();
}
fixDB();
