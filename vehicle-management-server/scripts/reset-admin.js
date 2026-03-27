const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const loadEnvFile = (fileName) => {
  const filePath = path.join(__dirname, "..", fileName);
  if (!fs.existsSync(filePath)) return false;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return true;
};

loadEnvFile(".env") || loadEnvFile(".env.example");

const conn = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "saurabhK@12",
  database: process.env.DB_NAME || "vehicle_db",
  port: Number(process.env.DB_PORT || 3306),
});

conn.connect(async (err) => {
  if (err) {
    console.error("DB connect error:", err);
    process.exit(1);
  }

  try {
    const adminHash = await bcrypt.hash("admin123", 10);
    const sql =
      "UPDATE users SET password_hash = ?, is_active = 1 WHERE username = 'admin'";

    conn.query(sql, [adminHash], (error, result) => {
      if (error) {
        console.error("Update failed:", error);
      } else {
        console.log("Rows affected:", result.affectedRows);
        if (!result.affectedRows) {
          console.warn("No admin row found. Create one manually if needed.");
        } else {
          console.log("Admin password reset to admin123 and activated.");
        }
      }
      conn.end();
    });
  } catch (hashError) {
    console.error("Hash generation failed:", hashError);
    conn.end();
    process.exit(1);
  }
});
