import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBoxes, FaEdit, FaSearch, FaSyncAlt, FaTrash } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-1)] shadow-[0_10px_28px_rgba(15,23,42,0.08)]";

const initialForm = {
  part_name: "",
  part_number: "",
  category: "",
  stock_qty: "",
  unit_price: "",
  supplier: "",
};

const partCategoryOptions = [
  "Engine Parts",
  "Brake Parts",
  "Suspension Parts",
  "Electrical Parts",
  "Filters",
  "Transmission Parts",
  "Body Parts",
  "General Parts",
];

const supplierOptions = [
  "OEM Supplier",
  "Authorized Dealer",
  "Local Vendor",
  "Warehouse Stock",
];

function SpareParts() {
  const location = useLocation();
  const [parts, setParts] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const isNight = document.body.classList.contains("theme-night");

  const loadParts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/spare-parts");
      setParts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "danger", message: "Failed to load spare parts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
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
    setCategoryFilter("All");
  }, [location.search]);

  const filteredParts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return parts.filter((part) => {
      const matchesLowStock =
        normalized !== "low-stock" || Number(part.stock_qty || 0) <= 5;
      const matchesSearch =
        !normalized ||
        normalized === "low-stock" ||
        [part.part_name, part.part_number, part.category, part.supplier]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesCategory =
        categoryFilter === "All" || String(part.category || "") === categoryFilter;

      return matchesLowStock && matchesSearch && matchesCategory;
    });
  }, [categoryFilter, parts, query]);

  const categoryFilterOptions = useMemo(() => {
    const usedCategories = [...new Set(parts.map((part) => String(part.category || "").trim()).filter(Boolean))];
    return ["All", ...partCategoryOptions.filter((option) => usedCategories.includes(option)), ...usedCategories.filter((option) => !partCategoryOptions.includes(option))];
  }, [parts]);

  const stats = useMemo(() => {
    const totalItems = parts.length;
    const totalUnits = parts.reduce((sum, part) => sum + Number(part.stock_qty || 0), 0);
    const lowStock = parts.filter((part) => Number(part.stock_qty || 0) <= 5).length;
    const stockValue = parts.reduce(
      (sum, part) => sum + Number(part.stock_qty || 0) * Number(part.unit_price || 0),
      0
    );

    return { totalItems, totalUnits, lowStock, stockValue };
  }, [parts]);

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

    if (!form.part_name.trim() || !form.part_number.trim()) {
      setFeedback({ type: "warning", message: "Part name and part number are required." });
      return;
    }

    const payload = {
      part_name: form.part_name.trim(),
      part_number: form.part_number.trim(),
      category: form.category.trim(),
      stock_qty: Number(form.stock_qty || 0),
      unit_price: Number(form.unit_price || 0),
      supplier: form.supplier.trim(),
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/spare-parts/${editingId}`, payload);
        setFeedback({ type: "success", message: "Spare part updated successfully." });
      } else {
        await axios.post("http://localhost:5000/spare-parts", payload);
        setFeedback({ type: "success", message: "Spare part added successfully." });
        window.alert("Spare part added successfully.");
      }

      resetForm();
      await loadParts();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "danger",
        message: error.response?.data?.error || "Failed to save spare part.",
      });
    }
  };

  const handleEdit = (part) => {
    setEditingId(part.part_id);
    setForm({
      part_name: part.part_name || "",
      part_number: part.part_number || "",
      category: part.category || "",
      stock_qty: String(part.stock_qty ?? ""),
      unit_price: String(part.unit_price ?? ""),
      supplier: part.supplier || "",
    });
  };

  const handleDelete = async (id) => {
    setFeedback({ type: "", message: "" });
    if (!window.confirm("Delete this spare part?")) return;

    try {
      await axios.delete(`http://localhost:5000/spare-parts/${id}`);
      setFeedback({ type: "success", message: "Spare part deleted successfully." });
      if (editingId === id) resetForm();
      await loadParts();
    } catch (error) {
      console.error(error);
      setFeedback({ type: "danger", message: "Failed to delete spare part." });
    }
  };

  const feedbackClassMap = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const softCardClass = isNight
    ? "border-[var(--border-color)] bg-[linear-gradient(135deg,#0f172a_0%,#121c2f_55%,#172338_100%)]"
    : "border-[#dbe3f0] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)]";

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-9">
      <section className={`animate-fade-up overflow-hidden rounded-[28px] border shadow-[0_16px_40px_rgba(15,23,42,0.08)] ${softCardClass}`}>
        <div className="flex flex-col gap-5 px-6 py-8 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              Spare Parts Inventory
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Track workshop stock, pricing, and low-quantity parts in one place.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Manage spare parts like a real service center with part numbers, supplier data, stock quantity, and inventory value.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={loadParts}
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Part Types", value: stats.totalItems },
          { label: "Total Units", value: stats.totalUnits },
          { label: "Low Stock", value: stats.lowStock },
          { label: "Inventory Value", value: formatCurrency(stats.stockValue) },
        ].map((item, index) => (
          <section
            key={item.label}
            className={`${panelClass} animate-fade-up ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : index === 2 ? "animate-delay-3" : "animate-delay-4"}`}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{item.value}</p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--icon-bg)] text-lg text-[var(--icon-fg)]">
                <FaBoxes />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className={`${panelClass} animate-fade-up animate-delay-2`}>
        <div className="border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {editingId ? "Update Spare Part" : "Add Spare Part"}
          </h2>
        </div>
        <div className="grid gap-3 px-6 py-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <input name="part_name" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Part name" value={form.part_name} onChange={handleChange} />
          <input name="part_number" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Part number" value={form.part_number} onChange={handleChange} />
          <select name="category" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" value={form.category} onChange={handleChange}>
            <option value="">Select category</option>
            {partCategoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input name="stock_qty" type="number" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Stock" value={form.stock_qty} onChange={handleChange} />
          <input name="unit_price" type="number" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Unit price" value={form.unit_price} onChange={handleChange} />
          <select name="supplier" className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" value={form.supplier} onChange={handleChange}>
            <option value="">Select supplier</option>
            {supplierOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="flex gap-2 md:col-span-2 lg:col-span-3 2xl:col-span-6">
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
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Spare Parts Register</h2>
          <div className="flex w-full max-w-3xl flex-col gap-3 md:flex-row md:justify-end">
            <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 shadow-sm md:min-w-[220px]">
              <select
                className="w-full bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {categoryFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All Categories" : option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full items-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 shadow-sm md:max-w-md">
              <FaSearch className="mr-3 text-[var(--text-muted)]" />
              <input
                type="text"
                className="w-full border-0 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Search by part, category, number, supplier"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Part</th>
                <th className="px-6 py-4 font-semibold">Number</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Unit Price</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-[var(--text-muted)]">
                    Loading spare parts...
                  </td>
                </tr>
              ) : filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <tr key={part.part_id} className="hover:bg-black/[0.02] theme-night:hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{part.part_name}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{part.part_number}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{part.category || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${Number(part.stock_qty || 0) <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {part.stock_qty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{formatCurrency(part.unit_price)}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{part.supplier || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600" onClick={() => handleEdit(part)}>
                          <FaEdit />
                        </button>
                        <button className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600" onClick={() => handleDelete(part.part_id)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-[var(--text-muted)]">
                    No spare parts found.
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

export default SpareParts;
