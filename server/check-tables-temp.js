const mysql = require('mysql2/promise');

async function checkTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });

    try {
        const [tables] = await connection.query("SHOW TABLES");
        console.log('Tables:', JSON.stringify(tables));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkTables();
