const express = require("express");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const runtimePort = process.env.PORT;

const loadEnvFile = (fileName) => {
  const filePath = path.join(__dirname, fileName);
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

if (runtimePort) {
  process.env.PORT = runtimePort;
}

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "vehicle_mgmt_dev_secret";
const SALT_ROUNDS = 10;
const PORT = process.env.PORT || 5000;
const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || "";

/* ================= MYSQL CONNECTION ================= */

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

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    if (err.code === "AUTH_SWITCH_PLUGIN_ERROR") {
      console.error(
        [
          "Database authentication plugin is not supported by mysql2.",
          "The configured DB user is likely using Windows/GSSAPI auth (for example auth_gssapi_client).",
          "Create a dedicated MariaDB user with password authentication, then update DB_USER and DB_PASSWORD in vehicle-management-server/.env.",
          "Example:",
          "CREATE USER 'vehicle_app'@'localhost' IDENTIFIED BY 'your_password';",
          "GRANT ALL PRIVILEGES ON vehicle_db.* TO 'vehicle_app'@'localhost';",
          "FLUSH PRIVILEGES;",
        ].join("\n")
      );
    }
  } else {
    console.log("Connected to MySQL");
    initializeDatabase();
  }
});

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

let serviceMasterIdColumn = "service_id";

async function detectServiceMasterIdColumn() {
  try {
    const columns = await queryAsync("SHOW COLUMNS FROM service_master");

    if (!Array.isArray(columns)) return;

    const columnNames = columns.map((column) => column.Field);

    if (columnNames.includes("service_id")) {
      serviceMasterIdColumn = "service_id";
    } else if (columnNames.includes("master_service_id")) {
      serviceMasterIdColumn = "master_service_id";
    }
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") {
      console.error("Failed to detect service_master id column:", error);
    }
  }
}

async function initializeDatabase() {
  await detectServiceMasterIdColumn();
  await ensureAuthTablesAndSeed();
  await ensureBillingTables();
  await ensureSparePartsTable();
  await ensureBatteriesTable();
}

/* ================= MIDDLEWARE ================= */

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

/* ================= SETUP AUTH TABLES ================= */

async function ensureAuthTablesAndSeed() {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150),
        password_hash VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        login_count INT NOT NULL DEFAULT 0,
        last_login_at DATETIME NULL,
        logout_count INT NOT NULL DEFAULT 0,
        last_logout_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
      ) ENGINE=InnoDB
    `);

    const userColumns = await queryAsync("SHOW COLUMNS FROM users");
    const userColumnNames = new Set(
      Array.isArray(userColumns) ? userColumns.map((column) => column.Field) : []
    );

    if (!userColumnNames.has("login_count")) {
      await queryAsync(
        "ALTER TABLE users ADD COLUMN login_count INT NOT NULL DEFAULT 0 AFTER is_active"
      );
    }

    if (!userColumnNames.has("last_login_at")) {
      await queryAsync(
        "ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER login_count"
      );
    }

    if (!userColumnNames.has("logout_count")) {
      await queryAsync(
        "ALTER TABLE users ADD COLUMN logout_count INT NOT NULL DEFAULT 0 AFTER last_login_at"
      );
    }

    if (!userColumnNames.has("last_logout_at")) {
      await queryAsync(
        "ALTER TABLE users ADD COLUMN last_logout_at DATETIME NULL AFTER logout_count"
      );
    }

    const defaultRoles = [
      "super_admin",
      "admin",
      "staff",
    ];

    for (const role of defaultRoles) {
      await queryAsync("INSERT IGNORE INTO roles (role_name) VALUES (?)", [role]);
    }

    const seedUsers = [
      {
        name: "System Admin",
        username: "admin",
        email: "admin@local",
        password: "admin123",
        role_name: "super_admin",
      },
    ];

    for (const seedUser of seedUsers) {
      const existingUserRows = await queryAsync(
        `
        SELECT u.user_id
        FROM users u
        WHERE u.username = ?
        LIMIT 1
        `,
        [seedUser.username]
      );

      if (Array.isArray(existingUserRows) && existingUserRows.length > 0) {
        continue;
      }

      const hashedPassword = await bcrypt.hash(seedUser.password, SALT_ROUNDS);

      await queryAsync(
        `
        INSERT INTO users (name, username, email, password_hash, role_id, is_active)
        SELECT ?, ?, ?, ?, role_id, 1
        FROM roles
        WHERE role_name = ?
        `,
        [
          seedUser.name,
          seedUser.username,
          seedUser.email,
          hashedPassword,
          seedUser.role_name,
        ]
      );

      console.log(
        `Seeded default ${seedUser.role_name}: ${seedUser.username} / ${seedUser.password}`
      );
    }
  } catch (error) {
    console.error("Failed to setup auth tables/seed:", error);
  }
}

async function ensureBillingTables() {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS bills (
        bill_id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        bill_number VARCHAR(40) NOT NULL UNIQUE,
        customer_name VARCHAR(120) NOT NULL,
        vehicle_name VARCHAR(160) NOT NULL,
        registration VARCHAR(60),
        service_date DATE,
        status VARCHAR(50),
        notes TEXT,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bills_job_card FOREIGN KEY (job_id) REFERENCES job_cards(job_id) ON DELETE CASCADE,
        CONSTRAINT fk_bills_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  } catch (error) {
    console.error("Failed to setup billing tables:", error);
  }
}

async function ensureSparePartsTable() {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS spare_parts (
        part_id INT AUTO_INCREMENT PRIMARY KEY,
        part_name VARCHAR(140) NOT NULL,
        part_number VARCHAR(80) NOT NULL UNIQUE,
        category VARCHAR(100),
        stock_qty INT NOT NULL DEFAULT 0,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        supplier VARCHAR(140),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
  } catch (error) {
    console.error("Failed to setup spare parts table:", error);
  }
}

async function ensureBatteriesTable() {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS batteries (
        battery_id INT AUTO_INCREMENT PRIMARY KEY,
        battery_name VARCHAR(140) NOT NULL,
        battery_code VARCHAR(80) NOT NULL UNIQUE,
        brand VARCHAR(100),
        capacity VARCHAR(80),
        stock_qty INT NOT NULL DEFAULT 0,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        warranty_months INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
  } catch (error) {
    console.error("Failed to setup batteries table:", error);
  }
}


/* ================= AUTH ================= */

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Login body:", req.body);

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const rows = await queryAsync(
      `
      SELECT
        u.user_id,
        u.name,
        u.username,
        u.email,
        u.password_hash,
        u.is_active,
        r.role_name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ?
      LIMIT 1
      `,
      [username]
    );

    console.log("Rows found:", Array.isArray(rows) ? rows.length : 0);

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log("No user found for username:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    console.log("DB user found:", user.username);
    console.log("Stored hash:", user.password_hash);
    console.log("Active:", user.is_active);

    if (!user.is_active) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    console.log("Password entered:", password);
    console.log("Password match result:", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await queryAsync(
      `
      UPDATE users
      SET login_count = COALESCE(login_count, 0) + 1,
          last_login_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      `,
      [user.user_id]
    );

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
});

app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const rows = await queryAsync(
      `
      SELECT
        u.user_id,
        u.name,
        u.username,
        u.email,
        u.is_active,
        r.role_name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
      LIMIT 1
      `,
      [req.user.user_id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/auth/logout", authenticateToken, async (req, res) => {
  try {
    await queryAsync(
      `
      UPDATE users
      SET logout_count = COALESCE(logout_count, 0) + 1,
          last_logout_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      `,
      [req.user.user_id]
    );

    return res.json({ message: "Logout recorded" });
  } catch (error) {
    console.error("Logout tracking error:", error);
    return res.status(500).json({ error: "Failed to record logout" });
  }
});

app.get("/activity-summary", async (req, res) => {
  try {
    const rows = await queryAsync(`
      SELECT
        r.role_name AS role,
        COUNT(*) AS user_count,
        COALESCE(SUM(u.login_count), 0) AS login_count,
        COALESCE(SUM(u.logout_count), 0) AS logout_count,
        MAX(u.last_login_at) AS last_login_at,
        MAX(u.last_logout_at) AS last_logout_at
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.role_id
      WHERE r.role_name IN ('super_admin', 'admin', 'staff')
      GROUP BY r.role_name
      ORDER BY FIELD(
        r.role_name,
        'super_admin',
        'admin',
        'staff'
      )
    `);

    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Fetch activity summary error:", error);
    return res.status(500).json({ error: "Failed to fetch activity summary" });
  }
});

/* ================= ADMIN USERS ================= */

app.get(
  "/admin/roles",
  authenticateToken,
  requireRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const roles = await queryAsync(
        `
        SELECT role_id, role_name
        FROM roles
        WHERE role_name IN ('super_admin', 'admin', 'staff')
        ORDER BY FIELD(role_name, 'super_admin', 'admin', 'staff')
        `
      );
      return res.json(roles);
    } catch (error) {
      console.error("Fetch roles error:", error);
      return res.status(500).json({ error: "Failed to fetch roles" });
    }
  }
);

app.get(
  "/admin/users",
  authenticateToken,
  requireRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const users = await queryAsync(`
        SELECT
          u.user_id,
          u.name,
          u.username,
          u.email,
          u.is_active,
          COALESCE(u.login_count, 0) AS login_count,
          u.last_login_at,
          COALESCE(u.logout_count, 0) AS logout_count,
          u.last_logout_at,
          r.role_name AS role,
          u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name IN ('super_admin', 'admin', 'staff')
        ORDER BY u.created_at DESC
      `);

      return res.json(users);
    } catch (error) {
      console.error("Fetch users error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

app.post(
  "/admin/users",
  authenticateToken,
  requireRoles("super_admin"),
  async (req, res) => {
    try {
      const { name, username, email, password, role_name } = req.body;

      if (!name || !username || !password || !role_name) {
        return res.status(400).json({
          error: "Name, username, password, and role_name are required",
        });
      }

      const roles = await queryAsync(
        "SELECT role_id FROM roles WHERE role_name = ? LIMIT 1",
        [role_name]
      );

      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: "Invalid role_name" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await queryAsync(
        `
        INSERT INTO users (name, username, email, password_hash, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        `,
        [name.trim(), username.trim(), email || null, hashedPassword, roles[0].role_id]
      );

      return res.status(201).json({
        message: "User created successfully",
        user_id: result.insertId,
      });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({
        error: "Failed to create user",
        details: error.sqlMessage || error.message,
      });
    }
  }
);

app.put(
  "/admin/users/:id/status",
  authenticateToken,
  requireRoles("super_admin"),
  async (req, res) => {
    try {
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        return res.status(400).json({ error: "is_active must be boolean" });
      }

      if (Number(req.params.id) === Number(req.user.user_id) && !is_active) {
        return res.status(400).json({ error: "You cannot deactivate your own account" });
      }

      const result = await queryAsync(
        "UPDATE users SET is_active = ? WHERE user_id = ?",
        [is_active ? 1 : 0, req.params.id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Update user status error:", error);
      return res.status(500).json({ error: "Failed to update user status" });
    }
  }
);

app.put(
  "/admin/users/:id/role",
  authenticateToken,
  requireRoles("super_admin"),
  async (req, res) => {
    try {
      const { role_name } = req.body;

      if (!role_name || !String(role_name).trim()) {
        return res.status(400).json({ error: "role_name is required" });
      }

      if (Number(req.params.id) === Number(req.user.user_id)) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      const roles = await queryAsync(
        "SELECT role_id FROM roles WHERE role_name = ? LIMIT 1",
        [role_name]
      );

      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: "Invalid role_name" });
      }

      const result = await queryAsync(
        "UPDATE users SET role_id = ? WHERE user_id = ?",
        [roles[0].role_id, req.params.id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Update user role error:", error);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

app.put(
  "/admin/users/:id/password",
  authenticateToken,
  requireRoles("super_admin"),
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || String(password).length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await queryAsync(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [hashedPassword, req.params.id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User password reset successfully" });
    } catch (error) {
      console.error("Reset user password error:", error);
      return res.status(500).json({ error: "Failed to reset user password" });
    }
  }
);

/* ================= VEHICLES ================= */

app.get("/customers", authenticateToken, async (req, res) => {
  try {
    const customers = await queryAsync(`
      SELECT
        customer_id,
        name,
        mobile,
        email,
        address,
        created_at
      FROM customers
      ORDER BY customer_id DESC
    `);

    return res.json(Array.isArray(customers) ? customers : []);
  } catch (error) {
    console.error("Fetch customers error:", error);
    return res.status(500).json({
      error: "Failed to fetch customers",
      details: error.sqlMessage || error.message,
    });
  }
});

app.post("/customers", authenticateToken, async (req, res) => {
  const customer = {
    name: String(req.body?.name || "").trim(),
    mobile: String(req.body?.mobile || "").trim(),
    email: String(req.body?.email || "").trim(),
    address: String(req.body?.address || "").trim(),
  };

  if (!customer.name) {
    const message = "Customer name is required";
    return res.status(400).json({ error: message, message });
  }

  try {
    const result = await queryAsync(
      `
        INSERT INTO customers (name, mobile, email, address)
        VALUES (?, ?, ?, ?)
      `,
      [
        customer.name,
        customer.mobile || null,
        customer.email || null,
        customer.address || null,
      ]
    );

    const rows = await queryAsync(
      `
        SELECT
          customer_id,
          name,
          mobile,
          email,
          address,
          created_at
        FROM customers
        WHERE customer_id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message: "Customer added successfully",
      customer: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
    });
  } catch (error) {
    console.error("Add customer error:", error);
    const message = error.sqlMessage || error.message || "Failed to add customer";
    return res.status(500).json({ error: message, message });
  }
});

app.post("/vehicles", (req, res) => {
  const vehicle = {
    model: String(req.body?.model || "").trim(),
    owner: String(req.body?.owner || "").trim(),
    registration: String(req.body?.registration || "").trim(),
  };

  if (!vehicle.model || !vehicle.owner || !vehicle.registration) {
    const message = "Model, owner, and registration are required";
    return res.status(400).json({ error: message, message });
  }

  const sql = `
    INSERT INTO vehicles (model, owner, registration, is_deleted)
    VALUES (?, ?, ?, 0)
  `;

  db.query(sql, [vehicle.model, vehicle.owner, vehicle.registration], (err, result) => {
    if (err) {
      console.error("Add vehicle error:", err);
      if (err.code === "ER_DUP_ENTRY") {
        const message = `A vehicle with registration "${vehicle.registration}" already exists.`;
        return res.status(409).json({ error: message, message });
      }

      const message = err.sqlMessage || err.message || "Failed to add vehicle";
      return res.status(500).json({ error: message, message });
    }

    return res.status(201).json({
      message: "Vehicle added successfully",
      id: result.insertId,
    });
  });
});

app.get("/vehicles", (req, res) => {
  const sql = `
    SELECT
      vehicle_id AS ID,
      model AS Model,
      owner AS Owner,
      registration AS Registration,
      is_deleted AS IsDeleted,
      updated_at
    FROM vehicles
    WHERE is_deleted = 0
    ORDER BY vehicle_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch vehicles error:", err);
      return res.status(500).json({ error: err.sqlMessage || err.message });
    }

    return res.json(result);
  });
});

app.put("/vehicles/:id", (req, res) => {
  const { model, owner, registration } = req.body;

  const sql = `
    UPDATE vehicles
    SET model = ?, owner = ?, registration = ?
    WHERE vehicle_id = ? AND is_deleted = 0
  `;

  db.query(sql, [model, owner, registration, req.params.id], (err, result) => {
    if (err) {
      console.error("Update vehicle error:", err);
      return res.status(500).json({ error: err.sqlMessage || err.message });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    return res.json({ message: "Vehicle updated successfully" });
  });
});

app.delete("/vehicles/:id", (req, res) => {
  db.query(
    "UPDATE vehicles SET is_deleted = 1 WHERE vehicle_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Delete vehicle error:", err);
        return res.status(500).json({ error: err.sqlMessage || err.message });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.json({ message: "Vehicle deleted successfully" });
    }
  );
});

app.get("/vehicles/deleted", (req, res) => {
  const sql = `
    SELECT
      vehicle_id AS ID,
      model AS Model,
      owner AS Owner,
      registration AS Registration,
      is_deleted AS IsDeleted,
      updated_at
    FROM vehicles
    WHERE is_deleted = 1
    ORDER BY vehicle_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch deleted vehicles error:", err);
      return res.status(500).json({ error: err.sqlMessage || err.message });
    }

    return res.json(result);
  });
});

app.put("/vehicles/restore/:id", (req, res) => {
  db.query(
    "UPDATE vehicles SET is_deleted = 0 WHERE vehicle_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Restore vehicle error:", err);
        return res.status(500).json({ error: err.sqlMessage || err.message });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.json({ message: "Vehicle restored successfully" });
    }
  );
});

/* ================= SERVICE MASTER ================= */

app.get("/service-master", (req, res) => {
  const sql = `
    SELECT ${serviceMasterIdColumn} AS service_id, service_type, base_cost, is_active
    FROM service_master
    WHERE is_active = 1
    ORDER BY service_type ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch service master error:", err);
      return res.status(500).json({ error: "Failed to fetch service master" });
    }

    return res.json(result);
  });
});

app.get("/service-master/all", (req, res) => {
  const sql = `
    SELECT ${serviceMasterIdColumn} AS service_id, service_type, base_cost, is_active
    FROM service_master
    ORDER BY service_type ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch all service master error:", err);
      return res.status(500).json({ error: "Failed to fetch service master list" });
    }

    return res.json(result);
  });
});

app.post("/service-master", (req, res) => {
  const { service_type, base_cost } = req.body;

  if (!service_type || !String(service_type).trim()) {
    return res.status(400).json({ error: "Service type is required" });
  }

  const parsedCost = parseFloat(base_cost);

  if (Number.isNaN(parsedCost) || parsedCost < 0) {
    return res.status(400).json({ error: "Base cost must be 0 or greater" });
  }

  const sql = `
    INSERT INTO service_master (service_type, base_cost, is_active)
    VALUES (?, ?, 1)
  `;

  db.query(sql, [String(service_type).trim(), parsedCost], (err, result) => {
    if (err) {
      console.error("Add service master error:", err);
      return res.status(500).json({ error: "Failed to add service master" });
    }

    return res.status(201).json({
      message: "Service master added successfully",
      service_id: result.insertId,
    });
  });
});

app.put("/service-master/:id", (req, res) => {
  const { service_type, base_cost, is_active } = req.body;

  if (!service_type || !String(service_type).trim()) {
    return res.status(400).json({ error: "Service type is required" });
  }

  const parsedCost = parseFloat(base_cost);

  if (Number.isNaN(parsedCost) || parsedCost < 0) {
    return res.status(400).json({ error: "Base cost must be 0 or greater" });
  }

  const activeFlag = is_active === 0 || is_active === false ? 0 : 1;

  const sql = `
    UPDATE service_master
    SET service_type = ?, base_cost = ?, is_active = ?
    WHERE ${serviceMasterIdColumn} = ?
  `;

  db.query(
    sql,
    [String(service_type).trim(), parsedCost, activeFlag, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Update service master error:", err);
        return res.status(500).json({ error: "Failed to update service master" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Service master not found" });
      }

      return res.json({ message: "Service master updated successfully" });
    }
  );
});

app.delete("/service-master/:id", (req, res) => {
  const sql = `
    UPDATE service_master
    SET is_active = 0
    WHERE ${serviceMasterIdColumn} = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Delete service master error:", err);
      return res.status(500).json({ error: "Failed to delete service master" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Service master not found" });
    }

    return res.json({ message: "Service master deleted successfully" });
  });
});

/* ================= SERVICES ================= */

app.get("/services", (req, res) => {
  const sql = `
    SELECT
      s.service_id,
      s.vehicle_id,
      v.model AS vehicle_model,
      v.owner AS vehicle_owner,
      s.service_type,
      s.service_date,
      s.cost,
      s.status
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.vehicle_id
    WHERE s.is_deleted = 0
    ORDER BY s.service_date DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch services error:", err);
      return res.status(500).json({ error: "Failed to fetch services" });
    }

    return res.json(result);
  });
});

app.post("/services", (req, res) => {
  const { vehicle_id, service_type, service_date, cost, status } = req.body;

  if (!vehicle_id || !service_type || !service_date || !cost || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO services
    (vehicle_id, service_type, service_date, cost, status, is_deleted)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  db.query(sql, [vehicle_id, service_type, service_date, cost, status], (err, result) => {
    if (err) {
      console.error("Add service error:", err);
      return res.status(500).json({ error: "Failed to add service" });
    }

    return res.status(201).json({
      message: "Service added successfully",
      service_id: result.insertId,
    });
  });
});

app.put("/services/:id", (req, res) => {
  const { vehicle_id, service_type, service_date, cost, status } = req.body;

  if (!vehicle_id || !service_type || !service_date || !cost || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    UPDATE services
    SET vehicle_id = ?, service_type = ?, service_date = ?, cost = ?, status = ?
    WHERE service_id = ? AND is_deleted = 0
  `;

  db.query(
    sql,
    [vehicle_id, service_type, service_date, cost, status, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Update service error:", err);
        return res.status(500).json({ error: "Failed to update service" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Service not found" });
      }

      return res.json({ message: "Service updated successfully" });
    }
  );
});

app.delete("/services/:id", (req, res) => {
  const sql = `
    UPDATE services
    SET is_deleted = 1
    WHERE service_id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Delete service error:", err);
      return res.status(500).json({ error: "Failed to delete service" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Service not found" });
    }

    return res.json({ message: "Service deleted successfully" });
  });
});

/* ================= JOB CARDS ================= */

app.get("/job-cards", (req, res) => {
  const sql = `
    SELECT
      jc.job_id,
      jc.vehicle_id,
      v.model AS vehicle_model,
      v.owner AS vehicle_owner,
      v.registration AS vehicle_registration,
      jc.service_date,
      jc.status,
      jc.estimated_cost,
      jc.actual_cost,
      jc.remarks,
      jc.created_at
    FROM job_cards jc
    LEFT JOIN vehicles v ON jc.vehicle_id = v.vehicle_id
    ORDER BY jc.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch job cards error:", err);
      return res.status(500).json({ error: "Failed to fetch job cards" });
    }

    return res.json(result);
  });
});

app.get("/bills", (req, res) => {
  const sql = `
    SELECT
      b.bill_id,
      b.job_id,
      b.vehicle_id,
      b.bill_number,
      b.customer_name,
      b.vehicle_name,
      b.registration,
      b.service_date,
      b.status,
      b.notes,
      b.subtotal,
      b.tax,
      b.total,
      b.created_by,
      b.created_at,
      v.model AS vehicle_model,
      v.owner AS vehicle_owner
    FROM bills b
    LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
    ORDER BY b.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch bills error:", err);
      return res.status(500).json({ error: "Failed to fetch bills" });
    }

    return res.json(result);
  });
});

app.post("/bills", (req, res) => {
  const {
    job_id,
    vehicle_id,
    bill_number,
    customer_name,
    vehicle_name,
    registration,
    service_date,
    status,
    notes,
    subtotal,
    tax,
    total,
    created_by,
  } = req.body;

  if (!job_id || !vehicle_id || !bill_number || !customer_name || !vehicle_name) {
    return res.status(400).json({
      error: "Job, vehicle, bill number, customer name, and vehicle name are required",
    });
  }

  const parsedSubtotal = Number(subtotal ?? 0);
  const parsedTax = Number(tax ?? 0);
  const parsedTotal = Number(total ?? 0);

  if (![parsedSubtotal, parsedTax, parsedTotal].every(Number.isFinite)) {
    return res.status(400).json({ error: "Subtotal, tax, and total must be valid numbers" });
  }

  const sql = `
    INSERT INTO bills
    (
      job_id,
      vehicle_id,
      bill_number,
      customer_name,
      vehicle_name,
      registration,
      service_date,
      status,
      notes,
      subtotal,
      tax,
      total,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      job_id,
      vehicle_id,
      bill_number,
      customer_name,
      vehicle_name,
      registration ?? null,
      service_date || null,
      status || null,
      notes ?? null,
      parsedSubtotal,
      parsedTax,
      parsedTotal,
      created_by ?? null,
    ],
    (err, result) => {
      if (err) {
        console.error("Create bill error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Bill number already exists" });
        }
        return res.status(500).json({
          error: "Failed to save bill",
          details: err.sqlMessage || err.message,
          code: err.code,
        });
      }

      return res.status(201).json({
        message: "Bill saved successfully",
        bill_id: result.insertId,
      });
    }
  );
});

/* ================= SPARE PARTS ================= */

app.get("/spare-parts", (req, res) => {
  const sql = `
    SELECT
      part_id,
      part_name,
      part_number,
      category,
      stock_qty,
      unit_price,
      supplier,
      created_at,
      updated_at
    FROM spare_parts
    ORDER BY updated_at DESC, part_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch spare parts error:", err);
      return res.status(500).json({ error: "Failed to fetch spare parts" });
    }

    return res.json(result);
  });
});

app.post("/spare-parts", (req, res) => {
  const part_name = String(req.body?.part_name || "").trim();
  const part_number = String(req.body?.part_number || "").trim();
  const category = String(req.body?.category || "").trim();
  const supplier = String(req.body?.supplier || "").trim();
  const stock_qty = Number(req.body?.stock_qty ?? 0);
  const unit_price = Number(req.body?.unit_price ?? 0);

  if (!part_name || !part_number) {
    return res.status(400).json({ error: "Part name and part number are required" });
  }

  if (!Number.isFinite(stock_qty) || stock_qty < 0 || !Number.isInteger(stock_qty)) {
    return res.status(400).json({ error: "Stock quantity must be a whole number 0 or greater" });
  }

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    return res.status(400).json({ error: "Unit price must be 0 or greater" });
  }

  const sql = `
    INSERT INTO spare_parts (part_name, part_number, category, stock_qty, unit_price, supplier)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [part_name, part_number, category || null, stock_qty, unit_price, supplier || null],
    (err, result) => {
      if (err) {
        console.error("Create spare part error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Part number already exists" });
        }
        return res.status(500).json({ error: "Failed to add spare part" });
      }

      return res.status(201).json({
        message: "Spare part added successfully",
        part_id: result.insertId,
      });
    }
  );
});

app.put("/spare-parts/:id", (req, res) => {
  const part_name = String(req.body?.part_name || "").trim();
  const part_number = String(req.body?.part_number || "").trim();
  const category = String(req.body?.category || "").trim();
  const supplier = String(req.body?.supplier || "").trim();
  const stock_qty = Number(req.body?.stock_qty ?? 0);
  const unit_price = Number(req.body?.unit_price ?? 0);

  if (!part_name || !part_number) {
    return res.status(400).json({ error: "Part name and part number are required" });
  }

  if (!Number.isFinite(stock_qty) || stock_qty < 0 || !Number.isInteger(stock_qty)) {
    return res.status(400).json({ error: "Stock quantity must be a whole number 0 or greater" });
  }

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    return res.status(400).json({ error: "Unit price must be 0 or greater" });
  }

  const sql = `
    UPDATE spare_parts
    SET part_name = ?, part_number = ?, category = ?, stock_qty = ?, unit_price = ?, supplier = ?
    WHERE part_id = ?
  `;

  db.query(
    sql,
    [part_name, part_number, category || null, stock_qty, unit_price, supplier || null, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Update spare part error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Part number already exists" });
        }
        return res.status(500).json({ error: "Failed to update spare part" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Spare part not found" });
      }

      return res.json({ message: "Spare part updated successfully" });
    }
  );
});

app.delete("/spare-parts/:id", (req, res) => {
  db.query("DELETE FROM spare_parts WHERE part_id = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Delete spare part error:", err);
      return res.status(500).json({ error: "Failed to delete spare part" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Spare part not found" });
    }

    return res.json({ message: "Spare part deleted successfully" });
  });
});

/* ================= BATTERIES ================= */

app.get("/batteries", (req, res) => {
  const sql = `
    SELECT
      battery_id,
      battery_name,
      battery_code,
      brand,
      capacity,
      stock_qty,
      unit_price,
      warranty_months,
      created_at,
      updated_at
    FROM batteries
    ORDER BY updated_at DESC, battery_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch batteries error:", err);
      return res.status(500).json({ error: "Failed to fetch batteries" });
    }

    return res.json(result);
  });
});

app.post("/batteries", (req, res) => {
  const battery_name = String(req.body?.battery_name || "").trim();
  const battery_code = String(req.body?.battery_code || "").trim();
  const brand = String(req.body?.brand || "").trim();
  const capacity = String(req.body?.capacity || "").trim();
  const stock_qty = Number(req.body?.stock_qty ?? 0);
  const unit_price = Number(req.body?.unit_price ?? 0);
  const warranty_months = Number(req.body?.warranty_months ?? 0);

  if (!battery_name || !battery_code) {
    return res.status(400).json({ error: "Battery name and battery code are required" });
  }

  if (!Number.isFinite(stock_qty) || stock_qty < 0 || !Number.isInteger(stock_qty)) {
    return res.status(400).json({ error: "Stock quantity must be a whole number 0 or greater" });
  }

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    return res.status(400).json({ error: "Unit price must be 0 or greater" });
  }

  if (!Number.isFinite(warranty_months) || warranty_months < 0 || !Number.isInteger(warranty_months)) {
    return res.status(400).json({ error: "Warranty months must be a whole number 0 or greater" });
  }

  const sql = `
    INSERT INTO batteries
    (battery_name, battery_code, brand, capacity, stock_qty, unit_price, warranty_months)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [battery_name, battery_code, brand || null, capacity || null, stock_qty, unit_price, warranty_months],
    (err, result) => {
      if (err) {
        console.error("Create battery error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Battery code already exists" });
        }
        return res.status(500).json({ error: "Failed to add battery" });
      }

      return res.status(201).json({
        message: "Battery added successfully",
        battery_id: result.insertId,
      });
    }
  );
});

app.put("/batteries/:id", (req, res) => {
  const battery_name = String(req.body?.battery_name || "").trim();
  const battery_code = String(req.body?.battery_code || "").trim();
  const brand = String(req.body?.brand || "").trim();
  const capacity = String(req.body?.capacity || "").trim();
  const stock_qty = Number(req.body?.stock_qty ?? 0);
  const unit_price = Number(req.body?.unit_price ?? 0);
  const warranty_months = Number(req.body?.warranty_months ?? 0);

  if (!battery_name || !battery_code) {
    return res.status(400).json({ error: "Battery name and battery code are required" });
  }

  if (!Number.isFinite(stock_qty) || stock_qty < 0 || !Number.isInteger(stock_qty)) {
    return res.status(400).json({ error: "Stock quantity must be a whole number 0 or greater" });
  }

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    return res.status(400).json({ error: "Unit price must be 0 or greater" });
  }

  if (!Number.isFinite(warranty_months) || warranty_months < 0 || !Number.isInteger(warranty_months)) {
    return res.status(400).json({ error: "Warranty months must be a whole number 0 or greater" });
  }

  const sql = `
    UPDATE batteries
    SET battery_name = ?, battery_code = ?, brand = ?, capacity = ?, stock_qty = ?, unit_price = ?, warranty_months = ?
    WHERE battery_id = ?
  `;

  db.query(
    sql,
    [battery_name, battery_code, brand || null, capacity || null, stock_qty, unit_price, warranty_months, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Update battery error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Battery code already exists" });
        }
        return res.status(500).json({ error: "Failed to update battery" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Battery not found" });
      }

      return res.json({ message: "Battery updated successfully" });
    }
  );
});

app.delete("/batteries/:id", (req, res) => {
  db.query("DELETE FROM batteries WHERE battery_id = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Delete battery error:", err);
      return res.status(500).json({ error: "Failed to delete battery" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Battery not found" });
    }

    return res.json({ message: "Battery deleted successfully" });
  });
});

app.post("/job-cards", (req, res) => {
  const {
    vehicle_id,
    service_date,
    status,
    estimated_cost,
    actual_cost,
    remarks,
  } = req.body;

  if (!vehicle_id || !service_date || !status) {
    return res.status(400).json({
      error: "Vehicle, service date, and status are required",
    });
  }

  const sql = `
    INSERT INTO job_cards
    (vehicle_id, service_date, status, estimated_cost, actual_cost, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      vehicle_id,
      service_date,
      status,
      estimated_cost ?? null,
      actual_cost ?? null,
      remarks ?? null,
    ],
    (err, result) => {
      if (err) {
        console.error("Create job card error:", err);
        return res.status(500).json({
          error: "Failed to create job card",
          details: err.sqlMessage || err.message,
          code: err.code,
        });
      }

      return res.status(201).json({
        message: "Job card created successfully",
        job_id: result.insertId,
      });
    }
  );
});

app.put("/job-cards/:id", (req, res) => {
  const {
    vehicle_id,
    service_date,
    status,
    estimated_cost,
    actual_cost,
    remarks,
  } = req.body;

  if (!vehicle_id || !service_date || !status) {
    return res.status(400).json({
      error: "Vehicle, service date, and status are required",
    });
  }

  const sql = `
    UPDATE job_cards
    SET vehicle_id = ?, service_date = ?, status = ?, estimated_cost = ?, actual_cost = ?, remarks = ?
    WHERE job_id = ?
  `;

  db.query(
    sql,
    [
      vehicle_id,
      service_date,
      status,
      estimated_cost ?? null,
      actual_cost ?? null,
      remarks ?? null,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Update job card error:", err);
        return res.status(500).json({
          error: "Failed to update job card",
          details: err.sqlMessage || err.message,
          code: err.code,
        });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ error: "Job card not found" });
      }

      return res.json({ message: "Job card updated successfully" });
    }
  );
});

app.delete("/job-cards/:id", (req, res) => {
  db.query("DELETE FROM job_cards WHERE job_id = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Delete job card error:", err);
      return res.status(500).json({ error: "Failed to delete job card" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Job card not found" });
    }

    return res.json({ message: "Job card deleted successfully" });
  });
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
