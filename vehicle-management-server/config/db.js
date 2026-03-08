const mysql = require("mysql");
const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || "";

const db = mysql.createConnection(
  mysqlUrl
    ? mysqlUrl
    : {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "saurabhK@12",
        database: process.env.DB_NAME || "vehicle_db",
        port: Number(process.env.DB_PORT || 3306),
      }
);

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected!");
});

module.exports = db;
