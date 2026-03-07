const express = require("express");
const mysql = require("mysql");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "vehicle_db"
});

// Get all vehicles
router.get("/", (req, res) => {
  db.query("SELECT * FROM vehicles", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Add a vehicle
router.post("/", (req, res) => {
  const { model, owner, registration_number } = req.body;
  db.query(
    "INSERT INTO vehicles (model, owner, registration_number) VALUES (?, ?, ?)",
    [model, owner, registration_number],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Vehicle added successfully", id: result.insertId });
    }
  );
});

module.exports = router;
