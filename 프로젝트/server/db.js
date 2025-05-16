// const fs = require('fs');
// const path = require('path');
// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '5720',
//     database: 'sw_project',
//     waitForConnections: true,
//     connectionLimit: 10,
// });

// async function initializeDatabase() {
//   const schema = fs.readFileSync(path.join(__dirname, '../database/notes.sql'), 'utf8');
//   const connection = await pool.getConnection();
//   await connection.query(schema);
//   connection.release();
// }

// module.exports = { pool, initializeDatabase };
