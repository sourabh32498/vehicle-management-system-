const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "vehicle_mgmt_dev_secret";
const SALT_ROUNDS = 10;

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "saurabhK@12",
  database: "vehicle_db",
});

db.connect((err) => {
  if (err) console.error("MySQL connection error:", err);
  else {
    console.log("Connected to MySQL");
    ensureAuthTablesAndSeed();
  }
});

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Authentication required" });

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
      ) ENGINE=InnoDB
    `);

    const defaultRoles = ["super_admin", "admin", "staff"];
    for (const role of defaultRoles) {
      await queryAsync("INSERT IGNORE INTO roles (role_name) VALUES (?)", [role]);
    }

    const existingAdminRows = await queryAsync(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name = 'super_admin'
      LIMIT 1
      `
    );

    if (!Array.isArray(existingAdminRows) || existingAdminRows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
      await queryAsync(
        `
        INSERT INTO users (name, username, email, password_hash, role_id, is_active)
        SELECT 'System Admin', 'admin', 'admin@local', ?, role_id, 1
        FROM roles
        WHERE role_name = 'super_admin'
        `,
        [hashedPassword]
      );
      console.log("Seeded default super admin: admin / admin123");
    }
  } catch (error) {
    console.error("Failed to setup auth tables/seed:", error);
  }
}

/* ================= AUTH ================= */

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const rows = await queryAsync(
      `
      SELECT
        u.user_id,
        u.name,
        u.username,
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

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
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

    res.json(rows[0]);
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
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
        "SELECT role_id, role_name FROM roles ORDER BY role_name ASC"
      );
      res.json(roles);
    } catch (error) {
      console.error("Fetch roles error:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
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
          r.role_name AS role,
          u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.created_at DESC
      `);
      res.json(users);
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
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

      res.status(201).json({
        message: "User created successfully",
        user_id: result.insertId,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
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

      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ error: "Failed to update user status" });
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

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
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

      res.json({ message: "User password reset successfully" });
    } catch (error) {
      console.error("Reset user password error:", error);
      res.status(500).json({ error: "Failed to reset user password" });
    }
  }
);

/* ================= VEHICLES ================= */

// ADD vehicle
app.post("/vehicles", (req, res) => {
  const { model, owner, registration } = req.body;

  const sql = `
    INSERT INTO vehicles (Model, Owner, Registration, IsDeleted)
    VALUES (?, ?, ?, 0)
  `;

  db.query(sql, [model, owner, registration], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json({ message: "Vehicle added", id: result.insertId });
  });
});

// GET active vehicles
app.get("/vehicles", (req, res) => {
  db.query("SELECT * FROM vehicles WHERE IsDeleted = 0", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// UPDATE vehicle
app.put("/vehicles/:id", (req, res) => {
  const { model, owner, registration } = req.body;

  const sql = `
    UPDATE vehicles
    SET Model=?, Owner=?, Registration=?
    WHERE ID=? AND IsDeleted=0
  `;

  db.query(sql, [model, owner, registration, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Vehicle updated" });
  });
});

// SOFT DELETE vehicle
app.delete("/vehicles/:id", (req, res) => {
  db.query("UPDATE vehicles SET IsDeleted=1 WHERE ID=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Vehicle deleted" });
  });
});

// GET deleted vehicles
app.get("/vehicles/deleted", (req, res) => {
  db.query("SELECT * FROM vehicles WHERE IsDeleted=1", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// RESTORE vehicle
app.put("/vehicles/restore/:id", (req, res) => {
  db.query(
    "UPDATE vehicles SET IsDeleted=0 WHERE ID=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Vehicle not found" });
      res.json({ message: "Vehicle restored" });
    }
  );
});

/* ================= SERVICE MASTER ================= */

// GET active service master
app.get("/service-master", (req, res) => {
  const sql = `
    SELECT service_id, service_type, base_cost, is_active
    FROM service_master
    WHERE is_active = 1
    ORDER BY service_type ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch service master" });
    }
    res.json(result);
  });
});

// GET all service master records (including inactive)
app.get("/service-master/all", (req, res) => {
  const sql = `
    SELECT service_id, service_type, base_cost, is_active
    FROM service_master
    ORDER BY service_type ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch service master list" });
    }
    res.json(result);
  });
});

// ADD service master
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
      console.error(err);
      return res.status(500).json({ error: "Failed to add service master" });
    }

    res.status(201).json({
      message: "Service master added successfully",
      service_id: result.insertId,
    });
  });
});

// UPDATE service master
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
    WHERE service_id = ?
  `;

  db.query(
    sql,
    [String(service_type).trim(), parsedCost, activeFlag, req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update service master" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Service master not found" });
      }

      res.json({ message: "Service master updated successfully" });
    }
  );
});

// SOFT DELETE service master
app.delete("/service-master/:id", (req, res) => {
  const sql = `
    UPDATE service_master
    SET is_active = 0
    WHERE service_id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete service master" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service master not found" });
    }

    res.json({ message: "Service master deleted successfully" });
  });
});

/* ================= SERVICES ================= */

app.get("/services", (req, res) => {
  const sql = `
    SELECT
      s.service_id,
      s.vehicle_id,
      v.Model AS vehicle_model,
      v.Owner AS vehicle_owner,
      s.service_type,
      s.service_date,
      s.cost,
      s.status
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.ID
    WHERE s.is_deleted = 0
    ORDER BY s.service_date DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch services" });
    }
    res.json(result);
  });
});

/* ================= ADD SERVICES ================= */
app.post("/services", (req, res) => {
  const { vehicle_id, service_type, service_date, cost, status } = req.body;

  if (!vehicle_id || !service_type || !service_date || !cost || !status) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  const sql = `
    INSERT INTO services
    (vehicle_id, service_type, service_date, cost, status, is_deleted)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  db.query(sql, [vehicle_id, service_type, service_date, cost, status], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to add service" });
    }

    res.status(201).json({
      message: "Service added successfully",
      service_id: result.insertId,
    });
  });
});

/* ================= UPDATE SERVICES ================= */
app.put("/services/:id", (req, res) => {
  const { vehicle_id, service_type, service_date, cost, status } = req.body;

  if (!vehicle_id || !service_type || !service_date || !cost || !status) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  const sql = `
    UPDATE services
    SET vehicle_id=?, service_type=?, service_date=?, cost=?, status=?
    WHERE service_id=? AND is_deleted=0
  `;

  db.query(
    sql,
    [vehicle_id, service_type, service_date, cost, status, req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update service" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Service not found" });
      }

      res.json({ message: "Service updated successfully" });
    }
  );
});

/* ================= DELETE SERVICES ================= */
app.delete("/services/:id", (req, res) => {
  const sql = `
    UPDATE services
    SET is_deleted = 1
    WHERE service_id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete service" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  });
});

/* ================= JOB CARDS ================= */

app.get("/job-cards", (req, res) => {
  const sql = `
    SELECT
      jc.job_id,
      jc.vehicle_id,
      v.Model AS vehicle_model,
      v.Owner AS vehicle_owner,
      jc.service_date,
      jc.status,
      jc.estimated_cost,
      jc.actual_cost,
      jc.remarks,
      jc.created_at
    FROM job_cards jc
    LEFT JOIN vehicles v ON jc.vehicle_id = v.ID
    ORDER BY jc.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch job cards" });
    }
    res.json(result);
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
    return res
      .status(400)
      .json({ error: "Vehicle, service date, and status are required" });
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
        console.error(err);
        return res.status(500).json({
          error: "Failed to create job card",
          details: err.sqlMessage || err.message,
          code: err.code,
        });
      }
      res
        .status(201)
        .json({ message: "Job card created successfully", job_id: result.insertId });
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
    return res
      .status(400)
      .json({ error: "Vehicle, service date, and status are required" });
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
        console.error(err);
        return res.status(500).json({
          error: "Failed to update job card",
          details: err.sqlMessage || err.message,
          code: err.code,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Job card not found" });
      }

      res.json({ message: "Job card updated successfully" });
    }
  );
});

app.delete("/job-cards/:id", (req, res) => {
  db.query("DELETE FROM job_cards WHERE job_id = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete job card" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Job card not found" });
    }

    res.json({ message: "Job card deleted successfully" });
  });
});

/* ================= START SERVER ================= */

app.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);
