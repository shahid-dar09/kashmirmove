const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    const [drivers] = await connection.query('SELECT * FROM drivers');
    console.log('Drivers:', drivers);
    process.exit();
}
test();
