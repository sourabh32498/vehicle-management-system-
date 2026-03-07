import React from "react";
import { updateVehicle } from "../services/api";

function UpdateVehicle({ vehicle, onUpdate }) {
  const handleUpdate = async () => {
    const model = prompt("Enter vehicle model", vehicle.model || vehicle.Model);
    if (model === null) return;

    const owner = prompt("Enter owner name", vehicle.owner || vehicle.Owner);
    if (owner === null) return;

    const registration = prompt(
      "Enter registration number",
      vehicle.registration || vehicle.Registration
    );
    if (registration === null) return;

    try {
      await updateVehicle(vehicle.vehicle_id || vehicle.ID, {
        model,
        owner,
        registration,
      });

      alert("Vehicle updated successfully!");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      const message = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Update failed: ${message}`);
    }
  };

  return (
    <button
      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
      onClick={handleUpdate}
      type="button"
    >
      Update
    </button>
  );
}

export default UpdateVehicle;
