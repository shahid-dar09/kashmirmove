const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    const [bookings] = await connection.query('SELECT * FROM bookings');
    console.log('Bookings:', bookings);
    process.exit();
}
test();
