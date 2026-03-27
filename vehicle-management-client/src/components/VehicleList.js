import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCar,
  FaSearch,
  FaPlus,
  FaRecycle,
  FaSyncAlt,
  FaFilter,
} from "react-icons/fa";
import UpdateVehicle from "./UpdateVehicle";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]";

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    model: "",
    owner: "",
    registration: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const isNight = document.body.classList.contains("theme-night");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        axios.get("http://localhost:5000/vehicles"),
        axios.get("http://localhost:5000/vehicles/deleted"),
      ]);

      setVehicles(Array.isArray(activeRes.data) ? activeRes.data : []);
      setDeletedCount(Array.isArray(deletedRes.data) ? deletedRes.data.length : 0);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "danger", message: "Failed to load vehicles." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (location.state?.refreshTs) {
      fetchVehicles();
      setFeedback({ type: "success", message: "Vehicle restored successfully." });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vehicles;

    return vehicles.filter((v) => {
      const model = String(v.Model || "").toLowerCase();
      const owner = String(v.Owner || "").toLowerCase();
      const registration = String(v.Registration || "").toLowerCase();
      return (
        model.includes(normalized) ||
        owner.includes(normalized) ||
        registration.includes(normalized)
      );
    });
  }, [query, vehicles]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    setFeedback({ type: "", message: "" });

    const payload = {
      model: form.model.trim(),
      owner: form.owner.trim(),
      registration: form.registration.trim(),
    };

    if (!payload.model || !payload.owner || !payload.registration) {
      setFeedback({ type: "warning", message: "Please fill all fields." });
      return;
    }

    try {
      const { data } = await axios.post("http://localhost:5000/vehicles", payload);
      setForm({ model: "", owner: "", registration: "" });
      setFeedback({ type: "success", message: "Vehicle added successfully." });
      await fetchVehicles();
      window.alert(data?.message || "Vehicle added successfully.");
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.sqlMessage ||
        err.response?.data?.message ||
        err.message ||
        "Failed to add vehicle. Please try again.";
      setFeedback({ type: "danger", message: errorMessage });
    }
  };

  const handleDelete = async (id) => {
    setFeedback({ type: "", message: "" });
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await axios.delete(`http://localhost:5000/vehicles/${id}`);
      setFeedback({ type: "success", message: "Vehicle moved to deleted list." });
      fetchVehicles();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "danger", message: "Failed to delete vehicle. Please try again." });
    }
  };

  const feedbackClassMap = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const stats = [
    {
      label: "Active Vehicles",
      value: vehicles.length,
      icon: FaCar,
      iconClass: isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    },
    {
      label: "Deleted Vehicles",
      value: deletedCount,
      icon: FaRecycle,
      iconClass: isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    },
    {
      label: "Filtered Result",
      value: filteredVehicles.length,
      icon: FaFilter,
      iconClass: isNight ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    },
  ];

  const shellClass = isNight ? "text-[var(--text-primary)]" : "text-slate-950";
  const heroClass = isNight
    ? "bg-[linear-gradient(135deg,#0f172a_0%,#121c2f_55%,#172338_100%)] ring-[var(--border-color)] shadow-[0_14px_36px_rgba(2,6,23,0.38)]"
    : "bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] shadow-[0_10px_28px_rgba(37,99,235,0.06)] ring-[#dbe3f0]";
  const panelThemeClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] shadow-[0_16px_36px_rgba(2,6,23,0.35)]"
    : panelClass;
  const softButtonClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
    : "border border-[#dbe3f0] bg-white text-slate-700 hover:bg-slate-50";
  const solidButtonClass = isNight
    ? "bg-white text-slate-950 hover:bg-slate-100"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const inputClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-sky-400 focus:ring-sky-500/20"
    : "border-[#dbe3f0] bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-100";
  const tableSearchClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] focus-within:border-sky-400 focus-within:ring-sky-500/20"
    : "border-[var(--border-color)] bg-white focus-within:border-sky-500 focus-within:ring-sky-100";
  const tableRowHover = isNight ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";

  return (
    <div className={`mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-9 ${shellClass}`}>
      <section className={`animate-fade-up overflow-hidden rounded-[28px] ring-1 ${heroClass}`}>
        <div className="flex flex-col gap-5 px-6 py-8 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div
              className={`mb-4 inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm ${
                isNight ? "bg-white/10 text-slate-200" : "bg-white text-slate-600"
              }`}
            >
              Fleet Management
            </div>
            <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isNight ? "text-white" : "text-slate-950"}`}>
              Manage active vehicles and archived fleet records.
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${isNight ? "text-slate-300" : "text-slate-500"}`}>
              Add vehicles, search owners and registrations, and review deleted records from one admin workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/deleted"
              className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${softButtonClass}`}
            >
              <FaRecycle className="mr-2" />
              Deleted Vehicles
            </Link>
            <button
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${solidButtonClass}`}
              onClick={fetchVehicles}
            >
              <FaSyncAlt className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {feedback.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedbackClassMap[feedback.type] || "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, iconClass }, index) => (
          <section
            key={label}
            className={`${panelThemeClass} animate-fade-up ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : "animate-delay-3"}`}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
              </div>
              <span
                className={[
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg",
                  iconClass,
                ].join(" ")}
              >
                <Icon />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className={`${panelThemeClass} animate-fade-up animate-delay-2`}>
        <div className="border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add New Vehicle</h2>
        </div>
        <div className="grid gap-3 px-6 py-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            type="text"
            name="model"
            className={`rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${inputClass}`}
            placeholder="Model"
            value={form.model}
            onChange={handleChange}
          />
          <input
            type="text"
            name="owner"
            className={`rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${inputClass}`}
            placeholder="Owner"
            value={form.owner}
            onChange={handleChange}
          />
          <input
            type="text"
            name="registration"
            className={`rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${inputClass}`}
            placeholder="Registration"
            value={form.registration}
            onChange={handleChange}
          />
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            onClick={handleAdd}
          >
            <FaPlus className="mr-2" />
            Add Vehicle
          </button>
        </div>
      </section>

      <section className={`${panelThemeClass} animate-fade-up animate-delay-3`}>
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Vehicle List</h2>
          <div className={`flex w-full max-w-md items-center rounded-2xl border px-4 shadow-sm transition focus-within:ring-4 ${tableSearchClass}`}>
            <FaSearch className="mr-3 text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full border-0 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by model, owner, registration"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Model</th>
                <th className="px-6 py-4 font-semibold">Owner</th>
                <th className="px-6 py-4 font-semibold">Registration</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-muted)]">
                    Loading vehicles...
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.ID} className={tableRowHover}>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{v.ID}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{v.Model}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{v.Owner}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                        {v.Registration}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <UpdateVehicle vehicle={v} onUpdate={fetchVehicles} />
                        <button
                          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                          onClick={() => handleDelete(v.ID)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-muted)]">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default VehicleList;
