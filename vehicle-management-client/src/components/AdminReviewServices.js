import React, { useEffect, useMemo, useState } from "react";
import { FaCar, FaClipboardCheck, FaSearch, FaSyncAlt, FaTools } from "react-icons/fa";
import { getServices } from "../services/api";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]";

function AdminReviewServices() {
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const isNight = document.body.classList.contains("theme-night");

  const fetchServices = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const response = await getServices();
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load admin service review:", error);
      setFeedback("Failed to load services for review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return services;

    return services.filter((service) =>
      [
        service.vehicle_model,
        service.vehicle_owner,
        service.service_type,
        service.status,
        service.service_id,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalized))
    );
  }, [query, services]);

  const pendingCount = useMemo(
    () =>
      services.filter((service) => {
        const status = String(service.status || "").toLowerCase();
        return status === "pending" || status === "in progress";
      }).length,
    [services]
  );

  const completedCount = useMemo(
    () =>
      services.filter((service) => String(service.status || "").toLowerCase() === "completed")
        .length,
    [services]
  );

  const stats = [
    {
      label: "Total Services",
      value: services.length,
      icon: FaTools,
      iconClass: isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    },
    {
      label: "Needs Review",
      value: pendingCount,
      icon: FaClipboardCheck,
      iconClass: isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: FaCar,
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
  const searchShellClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] focus-within:border-sky-400 focus-within:ring-sky-500/20"
    : "border-[#dbe3f0] bg-white focus-within:border-sky-500 focus-within:ring-sky-100";
  const tableRowHover = isNight ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "completed") return "bg-emerald-100 text-emerald-700";
    if (value === "in progress") return "bg-sky-100 text-sky-700";
    return "bg-amber-100 text-amber-700";
  };

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
              Admin Service Review
            </div>
            <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isNight ? "text-white" : "text-slate-950"}`}>
              Review workshop services with a cleaner admin view.
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${isNight ? "text-slate-300" : "text-slate-500"}`}>
              Track service status, vehicle owners, and queue activity from one admin-focused review page.
            </p>
          </div>
          <button
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${softButtonClass}`}
            onClick={fetchServices}
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Service Review Queue</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Review service records by owner, vehicle, type, date, and status.
            </p>
          </div>
          <div className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 md:max-w-md ${searchShellClass}`}>
            <FaSearch className="text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by vehicle, owner, service, status"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className={isNight ? "bg-white/[0.03]" : "bg-slate-50/90"}>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <th className="px-6 py-4">Service ID</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Loading services...
                  </td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <tr key={service.service_id} className={`transition ${tableRowHover}`}>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{service.service_id}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{service.vehicle_model || `Vehicle #${service.vehicle_id}`}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{service.vehicle_owner || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{service.service_type || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {service.service_date ? new Date(service.service_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {service.cost != null ? `Rs. ${Number(service.cost).toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(service.status)}`}>
                        {service.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No services found.
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

export default AdminReviewServices;
