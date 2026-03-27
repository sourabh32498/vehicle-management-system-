import React, { useEffect, useMemo, useState } from "react";
import { FaBoxes, FaExclamationTriangle, FaSearch, FaSyncAlt, FaWarehouse } from "react-icons/fa";
import { getSpareParts } from "../services/api";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]";

function AdminReviewSpareParts() {
  const [parts, setParts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const isNight = document.body.classList.contains("theme-night");

  const fetchParts = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const response = await getSpareParts();
      setParts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load spare parts review:", error);
      setFeedback("Failed to load spare parts for review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const filteredParts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return parts;

    return parts.filter((part) =>
      [part.part_name, part.part_number, part.category, part.supplier]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalized))
    );
  }, [parts, query]);

  const lowStockCount = useMemo(
    () => parts.filter((part) => Number(part.stock_qty || 0) <= 5).length,
    [parts]
  );

  const totalUnits = useMemo(
    () => parts.reduce((sum, part) => sum + Number(part.stock_qty || 0), 0),
    [parts]
  );

  const inventoryValue = useMemo(
    () =>
      parts.reduce(
        (sum, part) => sum + Number(part.stock_qty || 0) * Number(part.unit_price || 0),
        0
      ),
    [parts]
  );

  const stats = [
    {
      label: "Part Types",
      value: parts.length,
      icon: FaBoxes,
      iconClass: isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    },
    {
      label: "Low Stock Alerts",
      value: lowStockCount,
      icon: FaExclamationTriangle,
      iconClass: isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Units",
      value: totalUnits,
      icon: FaWarehouse,
      iconClass: isNight ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    },
  ];

  const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
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
  const searchShellClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] focus-within:border-sky-400 focus-within:ring-sky-500/20"
    : "border-[#dbe3f0] bg-white focus-within:border-sky-500 focus-within:ring-sky-100";
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
              Admin Spare Parts Review
            </div>
            <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isNight ? "text-white" : "text-slate-950"}`}>
              Review spare parts stock with a cleaner admin view.
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${isNight ? "text-slate-300" : "text-slate-500"}`}>
              Monitor part numbers, suppliers, stock levels, and inventory value from one review screen.
            </p>
          </div>
          <button
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${softButtonClass}`}
            onClick={fetchParts}
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {feedback}
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
              <span className={["inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg", iconClass].join(" ")}>
                <Icon />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className={`${panelThemeClass} animate-fade-up animate-delay-2`}>
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Spare Parts Review</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Review part names, numbers, suppliers, stock quantities, and pricing.
            </p>
          </div>
          <div className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 md:max-w-md ${searchShellClass}`}>
            <FaSearch className="text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by part, code, category, supplier"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className={isNight ? "bg-white/[0.03]" : "bg-slate-50/90"}>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <th className="px-6 py-4">Part</th>
                <th className="px-6 py-4">Part Number</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Loading spare parts...
                  </td>
                </tr>
              ) : filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <tr key={part.part_id} className={`transition ${tableRowHover}`}>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{part.part_name || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{part.part_number || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{part.category || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{part.supplier || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{part.stock_qty ?? 0}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{formatCurrency(part.unit_price)}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {formatCurrency(Number(part.stock_qty || 0) * Number(part.unit_price || 0))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No spare parts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border-color)] px-6 py-4 text-sm text-[var(--text-muted)]">
          Total inventory value: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(inventoryValue)}</span>
        </div>
      </section>
    </div>
  );
}

export default AdminReviewSpareParts;
