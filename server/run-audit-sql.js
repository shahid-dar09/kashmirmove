const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runAuditSQL() {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'create_audit_logs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('Audit logs table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating audit logs table:', err);
        process.exit(1);
    }
}

runAuditSQL();
