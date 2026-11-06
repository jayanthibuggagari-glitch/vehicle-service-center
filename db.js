const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_MYSQL_PASSWORD',
    database: 'vehicle_service_db'
});

db.connect((err) => {
    if (err) {
        console.log('Database Connection Failed!');
        console.log(err.message);
    } else {
        console.log('MySQL Database Connected Successfully!');
    }
});

module.exports = db;