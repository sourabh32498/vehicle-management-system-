const db = require("../config/db");

const getVehicles = (req, res) => {
  db.query("SELECT * FROM vehicles", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
};

const addVehicle = (req, res) => {
  const { model, owner, registration_number } = req.body;
  db.query(
    "INSERT INTO vehicles (model, owner, registration_number) VALUES (?, ?, ?)",
    [model, owner, registration_number],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
      } else {
        res.json({ message: "Vehicle added successfully!", id: result.insertId });
      }
    }
  );
};


const updateVehicle = (req, res) => {
  const { id } = req.params;
  const { model, owner, registration_number } = req.body;
  db.query(
    "UPDATE vehicles SET model=?, owner=?, registration_number=? WHERE id=?",
    [model, owner, registration_number, id],
    (err, result) => {
      if (err) throw err;
      res.json({ message: "Vehicle updated successfully!" });
    }
  );
};

const deleteVehicle = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM vehicles WHERE id=?", [id], (err, result) => {
    if (err) throw err;
    res.json({ message: "Vehicle deleted successfully!" });
  });
};

module.exports = { getVehicles, addVehicle, updateVehicle, deleteVehicle };