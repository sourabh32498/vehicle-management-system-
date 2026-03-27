import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBolt, FaEdit, FaSearch, FaSyncAlt, FaTrash } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-1)] shadow-[0_10px_28px_rgba(15,23,42,0.08)]";

const initialForm = {
  battery_name: "",
  battery_code: "",
  brand: "",
  capacity: "",
  stock_qty: "",
  unit_price: "",
  warranty_months: "",
};

const batteryBrandOptions = ["Amaron", "Exide", "SF Sonic", "Bosch", "Livguard", "ACDelco"];
const batteryCapacityOptions = ["35 Ah", "45 Ah", "60 Ah", "80 Ah", "100 Ah", "120 Ah"];
const batteryWarrantyOptions = [12, 24, 36, 48, 60];

function Batteries() {
  const location = useLocation();
  const [batteries, setBatteries] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const isNight = document.body.classList.contains("theme-night");

  const loadBatteries = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/batteries");
      setBatteries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "danger", message: "Failed to load batteries." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatteries();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    const stock = params.get("stock");

    if (stock === "low") {
      setQuery("low-stock");
      return;
    }

    setQuery(search || "");
  }, [location.search]);

  const filteredBatteries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === "low-stock") {
      return batteries.filter((battery) => Number(battery.stock_qty || 0) <= 5);
    }
    if (!normalized) return batteries;

    return batteries.filter((battery) =>
      [battery.battery_name, battery.battery_code, battery.brand, battery.capacity]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [batteries, query]);

  const stats = useMemo(() => {
    const totalTypes = batteries.length;
    const totalStock = batteries.reduce((sum, battery) => sum + Number(battery.stock_qty || 0), 0);
    const lowStock = batteries.filter((battery) => Number(battery.stock_qty || 0) <= 5).length;
    const stockValue = batteries.reduce(
      (sum, battery) => sum + Number(battery.stock_qty || 0) * Number(battery.unit_price || 0),
      0
    );

    return { totalTypes, totalStock, lowStock, stockValue };
  }, [batteries]);

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Rs 0.00";
    return `Rs ${amount.toFixed(2)}`;
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async () => {
    setFeedback({ type: "", message: "" });

    if (!form.battery_name.trim() || !form.battery_code.trim()) {
      setFeedback({ type: "warning", message: "Battery name and battery code are required." });
      return;
    }

    const payload = {
      battery_name: form.battery_name.trim(),
      battery_code: form.battery_code.trim(),
      brand: form.brand.trim(),
      capacity: form.capacity.trim(),
      stock_qty: Number(form.stock_qty || 0),
      unit_price: Number(form.unit_price || 0),
      warranty_months: Number(form.warranty_months || 0),
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/batteries/${editingId}`, payload);
        setFeedback({ type: "success", message: "Battery updated successfully." });
      } else {
        await axios.post("http://localhost:5000/batteries", payload);
        setFeedback({ type: "success", message: "Battery added successfully." });
        window.alert("Battery added successfully.");
      }

      resetForm();
      await loadBatteries();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "danger",
        message: error.response?.data?.error || "Failed to save battery.",
      });
    }
  };

  const handleEdit = (battery) => {
    setEditingId(battery.battery_id);
    setForm({
      battery_name: battery.battery_name || "",
      battery_code: battery.battery_code || "",
      brand: battery.brand || "",
      capacity: battery.capacity || "",
      stock_qty: String(battery.stock_qty ?? ""),
      unit_price: String(battery.unit_price ?? ""),
      warranty_months: String(battery.warranty_months ?? ""),
    });
  };

  const handleDelete = async (id) => {
    setFeedback({ type: "", message: "" });
    if (!window.confirm("Delete this battery?")) return;

    try {
      await axios.delete(`http://localhost:5000/batteries/${id}`);
      setFeedback({ type: "success", message: "Battery deleted successfully." });
      if (editingId === id) resetForm();
      await loadBatteries();
    } catch (error) {
      console.error(error);
      setFeedback({ type: "danger", message: "Failed to delete battery." });
    }
  };

  const feedbackClassMap = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const softCardClass = isNight
    ? "border-[var(--border-color)] bg-[linear-gradient(135deg,#1a1325_0%,#171728_55%,#251f34_100%)]"
    : "border-[#e8d4a6] bg-[linear-gradient(135deg,#fff8e8_0%,#ffffff_55%,#fff4d6_100%)]";

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-9">
      <section className={`animate-fade-up overflow-hidden rounded-[28px] border shadow-[0_16px_40px_rgba(15,23,42,0.08)] ${softCardClass}`}>
        <div className="flex flex-col gap-5 px-6 py-8 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              Batteries Inventory
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Manage workshop battery stock, prices, and warranty details.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Keep battery models, product codes, brands, capacities, stock quantity, and warranty information organized in one place.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={loadBatteries}
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
        </div>
      </section>

      {feedback.message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${feedbackClassMap[feedback.type] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Battery Types", value: stats.totalTypes },
          { label: "Total Stock", value: stats.totalStock },
          { label: "Low Stock", value: stats.lowStock },
          { label: "Inventory Value", value: formatCurrency(stats.stockValue) },
        ].map((item, index) => (
          <section key={item.label} className={`${panelClass} animate-fade-up ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : index === 2 ? "animate-delay-3" : "animate-delay-4"}`}>
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{item.value}</p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--icon-bg)] text-lg text-[var(--icon-fg)]">
                <FaBolt />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className={`${panelClass} animate-fade-up animate-delay-2`}>
        <div className="border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {editingId ? "Update Battery" : "Add Battery"}
          </h2>
        </div>
        <div className="grid gap-3 px-6 py-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
          <input name="battery_name" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Battery name" value={form.battery_name} onChange={handleChange} />
          <input name="battery_code" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Battery code" value={form.battery_code} onChange={handleChange} />
          <select name="brand" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" value={form.brand} onChange={handleChange}>
            <option value="">Select brand</option>
            {batteryBrandOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select name="capacity" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" value={form.capacity} onChange={handleChange}>
            <option value="">Select capacity</option>
            {batteryCapacityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input name="stock_qty" type="number" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Stock" value={form.stock_qty} onChange={handleChange} />
          <input name="unit_price" type="number" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Price" value={form.unit_price} onChange={handleChange} />
          <select name="warranty_months" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" value={form.warranty_months} onChange={handleChange}>
            <option value="">Warranty</option>
            {batteryWarrantyOptions.map((option) => (
              <option key={option} value={option}>{option} months</option>
            ))}
          </select>
          <div className="flex gap-2 md:col-span-2 lg:col-span-3 2xl:col-span-7">
            <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600" onClick={handleSubmit}>
              {editingId ? "Update" : "Add"}
            </button>
            {editingId ? (
              <button className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className={`${panelClass} animate-fade-up animate-delay-3`}>
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Batteries Register</h2>
          <div className="flex w-full max-w-md items-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 shadow-sm">
            <FaSearch className="mr-3 text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full border-0 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by battery, brand, code, capacity"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Battery</th>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Brand</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Warranty</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-[var(--text-muted)]">Loading batteries...</td></tr>
              ) : filteredBatteries.length > 0 ? (
                filteredBatteries.map((battery) => (
                  <tr key={battery.battery_id} className="hover:bg-black/[0.02] theme-night:hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{battery.battery_name}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{battery.battery_code}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{battery.brand || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{battery.capacity || "-"}</td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${Number(battery.stock_qty || 0) <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{battery.stock_qty}</span></td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{formatCurrency(battery.unit_price)}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{battery.warranty_months} months</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600" onClick={() => handleEdit(battery)}><FaEdit /></button>
                        <button className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600" onClick={() => handleDelete(battery.battery_id)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-[var(--text-muted)]">No batteries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Batteries;
