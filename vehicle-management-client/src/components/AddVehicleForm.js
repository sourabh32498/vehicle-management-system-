// AddVehicle.js
import React, { useState } from "react";
import axios from "axios";

const AddVehicle = () => {
  const [vehicle, setVehicle] = useState({
    name: "",
    model: "",
    year: "",
    price: ""
  });

  const handleChange = e => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/vehicles", vehicle);
      alert(res.data.message);
      setVehicle({ name: "", model: "", year: "", price: "" }); // clear form
    } catch (err) {
      console.error(err);
      alert("Error adding vehicle");
    }
  };

  return (
    <div>
      <h2>Add Vehicle</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Vehicle Name"
          value={vehicle.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="model"
          placeholder="Model"
          value={vehicle.model}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={vehicle.year}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={vehicle.price}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Vehicle</button>
      </form>
    </div>
  );
};

export default AddVehicle;
