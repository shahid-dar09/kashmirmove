const mysql = require('mysql2/promise');

async function checkMoreCols() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });

    try {
        const [contacts] = await connection.query("SHOW COLUMNS FROM emergency_contacts");
        const [msgs] = await connection.query("SHOW COLUMNS FROM messages");
        console.log('emergency_contacts:', JSON.stringify(contacts));
        console.log('messages:', JSON.stringify(msgs));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkMoreCols();
