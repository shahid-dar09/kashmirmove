const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('Users:', users);
    
    const [drivers] = await connection.query('SELECT * FROM drivers');
    console.log('Drivers:', drivers);
    
    process.exit();
}
test();
