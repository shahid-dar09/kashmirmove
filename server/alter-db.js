const mysql = require('mysql2/promise');

async function alterDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });
    try {
        await connection.query('ALTER TABLE drivers ADD COLUMN is_online BOOLEAN DEFAULT FALSE');
        console.log('Added is_online column');
    } catch(e) {
        if(e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists');
        else console.error(e);
    }
    process.exit();
}
alterDB();
