const mysql = require("mysql");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "saurabhK@12",
  database: process.env.DB_NAME || "vehicle_db",
  port: Number(process.env.DB_PORT || 3306),
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected!");
});

module.exports = db;
