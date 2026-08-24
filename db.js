const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 8889, // MAMP-এর পোর্ট নম্বর
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('MySQL Connection Error:', err.message);
        return;
    }
    console.log('Connected to MAMP MySQL Database successfully!');
});

module.exports = db;