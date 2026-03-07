const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "vehicle_db"
});

// Admin login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const admin = result[0];

    // Compare entered password with hashed password in DB
    bcrypt.compare(password, admin.password, (err, match) => {
      if (err) return res.status(500).json({ error: err });
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        "secretkey",
        { expiresIn: "1h" }
      );
      res.json({ message: "Login successful", token });
    });
  });
});

// Protected dashboard route
router.get("/dashboard", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    res.json({ message: "Welcome to Admin Dashboard", admin: decoded });
  });
});

module.exports = router;
