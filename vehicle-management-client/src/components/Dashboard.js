import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCar,
  FaWrench,
  FaClock,
  FaCheckCircle,
  FaRupeeSign,
  FaSpinner,
  FaClipboardList,
  FaListAlt,
} from "react-icons/fa";

const panelClass =
  "overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--surface-1)] shadow-sm";

const statCards = [
  {
    key: "vehicles",
    label: "Vehicles",
    icon: FaCar,
    iconClass: "stat-icon-sky bg-sky-100 text-sky-700",
  },
  {
    key: "services",
    label: "Total Services",
    icon: FaWrench,
    iconClass: "stat-icon-emerald bg-emerald-100 text-emerald-700",
  },
  {
    key: "jobCards",
    label: "Total Job Cards",
    icon: FaClipboardList,
    iconClass: "stat-icon-slate bg-slate-200 text-slate-700",
  },
  {
    key: "revenue",
    label: "Total Revenue",
    icon: FaRupeeSign,
    iconClass: "stat-icon-violet bg-violet-100 text-violet-700",
  },
];

function Dashboard() {
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [pendingServices, setPendingServices] = useState(0);
  const [inProgressServices, setInProgressServices] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [jobCardsCount, setJobCardsCount] = useState(0);
  const [pendingJobCards, setPendingJobCards] = useState(0);
  const [completedJobCards, setCompletedJobCards] = useState(0);
  const [recentServices, setRecentServices] = useState([]);
  const [recentJobCards, setRecentJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [vehiclesRes, servicesRes, jobCardsRes] = await Promise.all([
          axios.get("http://localhost:5000/vehicles"),
          axios.get("http://localhost:5000/services"),
          axios.get("http://localhost:5000/job-cards"),
        ]);

        const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
        const services = Array.isArray(servicesRes.data) ? servicesRes.data : [];
        const jobCards = Array.isArray(jobCardsRes.data) ? jobCardsRes.data : [];

        setVehiclesCount(vehicles.length);
        setServicesCount(services.length);

        const pendingCount = services.filter(
          (s) => String(s.status || "").toLowerCase() === "pending"
        ).length;

        const inProgressCount = services.filter(
          (s) => String(s.status || "").toLowerCase() === "in progress"
        ).length;

        const completedCount = services.filter((s) => {
          const value = String(s.status || "").toLowerCase();
          return value === "completed" || value === "delivered";
        }).length;

        const revenue = services.reduce((sum, s) => {
          const value = parseFloat(s.cost);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        setPendingServices(pendingCount);
        setInProgressServices(inProgressCount);
        setCompletedServices(completedCount);
        setTotalRevenue(revenue);

        setJobCardsCount(jobCards.length);
        setPendingJobCards(
          jobCards.filter((j) => String(j.status || "").toLowerCase() === "pending").length
        );
        setCompletedJobCards(
          jobCards.filter((j) => {
            const value = String(j.status || "").toLowerCase();
            return value === "completed" || value === "delivered";
          }).length
        );

        setRecentServices(services.slice(0, 5));
        setRecentJobCards(jobCards.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    return String(value).slice(0, 10);
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Rs 0.00";
    return `Rs ${amount.toFixed(2)}`;
  };

  const serviceTotalForPercent = servicesCount || 1;
  const pendingServicePercent = Math.round((pendingServices / serviceTotalForPercent) * 100);
  const inProgressServicePercent = Math.round(
    (inProgressServices / serviceTotalForPercent) * 100
  );
  const completedServicePercent = Math.round((completedServices / serviceTotalForPercent) * 100);
  const inProgressJobCards =
    jobCardsCount - pendingJobCards - completedJobCards < 0
      ? 0
      : jobCardsCount - pendingJobCards - completedJobCards;

  const statValues = {
    vehicles: vehiclesCount,
    services: servicesCount,
    jobCards: jobCardsCount,
    revenue: formatCurrency(totalRevenue),
  };

  const handleAddVehicle = () => navigate("/vehicles");
  const handleAddService = () => navigate("/services");
  const handleJobCards = () => navigate("/job-cards");
  const handleVehicleList = () => navigate("/vehicles");

  const quickActions = [
    {
      label: "Add Vehicle",
      icon: FaCar,
      onClick: handleAddVehicle,
      className: "hero-soft-button",
    },
    {
      label: "Add Service",
      icon: FaWrench,
      onClick: handleAddService,
      className: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
    },
    {
      label: "Job Cards",
      icon: FaClipboardList,
      onClick: handleJobCards,
      className: "bg-slate-950 text-white hover:bg-slate-800",
    },
    {
      label: "Vehicle List",
      icon: FaListAlt,
      onClick: handleVehicleList,
      className: "hero-outline-button",
    },
  ];

  const serviceMetrics = [
    {
      label: "Pending",
      value: pendingServices,
      percent: pendingServicePercent,
      barClass: "bg-amber-400",
    },
    {
      label: "In Progress",
      value: inProgressServices,
      percent: inProgressServicePercent,
      barClass: "bg-slate-700",
    },
    {
      label: "Completed/Delivered",
      value: completedServices,
      percent: completedServicePercent,
      barClass: "bg-emerald-500",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="animate-fade-up overflow-hidden rounded-[28px] bg-[var(--hero-gradient-main)] shadow-sm ring-1 ring-black/5">
        <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div>
            <div className="hero-kicker mb-4 inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em]">
              Operations Dashboard
            </div>
            <h1 className="max-w-xl text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Vehicle service and job card performance at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              Review workload, revenue, and the latest service activity from a single control panel.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {quickActions.map(({ label, icon: Icon, onClick, className }) => (
                <button
                  key={label}
                  className={[
                    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    className,
                  ].join(" ")}
                  onClick={onClick}
                >
                  <Icon className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {statCards.map(({ key, label, icon: Icon, iconClass }) => (
              <div
                key={key}
                className="stat-surface animate-fade-up rounded-[22px] p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                      {statValues[key]}
                    </p>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${panelClass} animate-fade-up animate-delay-1`}>
          <div className="border-b border-[var(--border-color)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Service Status Overview
            </h2>
          </div>
          <div className="space-y-5 px-6 py-6">
            {serviceMetrics.map(({ label, value, percent, barClass }) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                  <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${panelClass} animate-fade-up animate-delay-2`}>
          <div className="border-b border-[var(--border-color)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Job Card Snapshot</h2>
          </div>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
            <div className="snapshot-card-amber rounded-[20px] p-5 text-center">
              <FaClock className="snapshot-icon-amber mx-auto mb-3 text-xl" />
              <div className="snapshot-label text-sm font-medium">Pending</div>
              <div className="snapshot-value mt-1 text-3xl font-bold">
                {pendingJobCards}
              </div>
            </div>
            <div className="snapshot-card-emerald rounded-[20px] p-5 text-center">
              <FaCheckCircle className="snapshot-icon-emerald mx-auto mb-3 text-xl" />
              <div className="snapshot-label text-sm font-medium">Completed</div>
              <div className="snapshot-value mt-1 text-3xl font-bold">
                {completedJobCards}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface-2)] p-5 sm:col-span-2">
              <div className="flex items-center justify-center gap-3 text-center">
                <FaSpinner className="text-slate-700" />
                <span className="text-sm text-[var(--text-muted)]">In Progress</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {inProgressJobCards}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${panelClass} animate-fade-up animate-delay-3`}>
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Services</h2>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Top 5
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-left text-[var(--text-muted)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                      Loading...
                    </td>
                  </tr>
                ) : recentServices.length > 0 ? (
                  recentServices.map((s) => (
                    <tr key={s.service_id} className="hover:bg-black/[0.02]">
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        {s.vehicle_model ? `${s.vehicle_model} (${s.vehicle_owner})` : s.vehicle_id}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {formatDate(s.service_date)}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">{s.status}</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)]">
                        {formatCurrency(s.cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                      No services found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${panelClass} animate-fade-up animate-delay-4`}>
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Job Cards</h2>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Top 5
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-left text-[var(--text-muted)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                      Loading...
                    </td>
                  </tr>
                ) : recentJobCards.length > 0 ? (
                  recentJobCards.map((j) => (
                    <tr key={j.job_id} className="hover:bg-black/[0.02]">
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        {j.vehicle_model ? `${j.vehicle_model} (${j.vehicle_owner})` : j.vehicle_id}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {formatDate(j.service_date)}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">{j.status}</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)]">
                        {formatCurrency(j.estimated_cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                      No job cards found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
