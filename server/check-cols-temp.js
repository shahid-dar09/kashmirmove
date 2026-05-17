const mysql = require('mysql2/promise');

async function checkCols() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kashmirmove'
    });

    try {
        const [docs] = await connection.query("SHOW COLUMNS FROM documents");
        const [driverDocs] = await connection.query("SHOW COLUMNS FROM driver_documents");
        console.log('documents:', JSON.stringify(docs));
        console.log('driver_documents:', JSON.stringify(driverDocs));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkCols();
