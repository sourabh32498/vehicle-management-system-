import React from "react";
import { deleteVehicle } from "../services/api";

function DeleteVehicle({ id, onDelete }) {
  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    deleteVehicle(id)
      .then(() => {
        alert("Vehicle deleted successfully!");
        if (onDelete) onDelete(); // refresh list after delete
      })
      .catch(err => console.log(err));
  };

  return (
    <button
      className="btn btn-danger btn-delete"
      onClick={handleDelete}
      type="button"
    >
      Delete
    </button>
  );
}

export default DeleteVehicle;
