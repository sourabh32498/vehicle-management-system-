import React, { useEffect, useMemo, useState } from "react";
import { FaBatteryThreeQuarters, FaExclamationTriangle, FaSearch, FaSyncAlt, FaWarehouse } from "react-icons/fa";
import { getBatteries } from "../services/api";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]";

function AdminReviewBatteries() {
  const [batteries, setBatteries] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const isNight = document.body.classList.contains("theme-night");

  const fetchBatteries = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const response = await getBatteries();
      setBatteries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load batteries review:", error);
      setFeedback("Failed to load batteries for review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatteries();
  }, []);

  const filteredBatteries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return batteries;

    return batteries.filter((battery) =>
      [battery.battery_name, battery.battery_code, battery.brand, battery.capacity]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalized))
    );
  }, [batteries, query]);

  const lowStockCount = useMemo(
    () => batteries.filter((battery) => Number(battery.stock_qty || 0) <= 5).length,
    [batteries]
  );

  const totalUnits = useMemo(
    () => batteries.reduce((sum, battery) => sum + Number(battery.stock_qty || 0), 0),
    [batteries]
  );

  const inventoryValue = useMemo(
    () =>
      batteries.reduce(
        (sum, battery) => sum + Number(battery.stock_qty || 0) * Number(battery.unit_price || 0),
        0
      ),
    [batteries]
  );

  const stats = [
    {
      label: "Battery Types",
      value: batteries.length,
      icon: FaBatteryThreeQuarters,
      iconClass: isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    },
    {
      label: "Low Stock Alerts",
      value: lowStockCount,
      icon: FaExclamationTriangle,
      iconClass: isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Stock",
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
              Admin Battery Review
            </div>
            <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isNight ? "text-white" : "text-slate-950"}`}>
              Review battery stock with a cleaner admin view.
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${isNight ? "text-slate-300" : "text-slate-500"}`}>
              Monitor battery codes, brand, capacity, warranty, stock levels, and inventory value from one review screen.
            </p>
          </div>
          <button
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${softButtonClass}`}
            onClick={fetchBatteries}
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Battery Review</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Review battery names, product codes, brand, capacity, stock, pricing, and warranty.
            </p>
          </div>
          <div className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 md:max-w-md ${searchShellClass}`}>
            <FaSearch className="text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by battery, code, brand, capacity"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className={isNight ? "bg-white/[0.03]" : "bg-slate-50/90"}>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <th className="px-6 py-4">Battery</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Warranty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Loading batteries...
                  </td>
                </tr>
              ) : filteredBatteries.length > 0 ? (
                filteredBatteries.map((battery) => (
                  <tr key={battery.battery_id} className={`transition ${tableRowHover}`}>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{battery.battery_name || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{battery.battery_code || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{battery.brand || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{battery.capacity || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{battery.stock_qty ?? 0}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{formatCurrency(battery.unit_price)}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {battery.warranty_months ? `${battery.warranty_months} months` : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No batteries found.
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

export default AdminReviewBatteries;
