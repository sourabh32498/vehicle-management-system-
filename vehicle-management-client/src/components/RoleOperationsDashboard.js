import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxes,
  FaCar,
  FaClipboardList,
  FaClock,
  FaMoon,
  FaPowerOff,
  FaSun,
  FaTools,
  FaWrench,
} from "react-icons/fa";
import {
  getBatteries,
  getJobCards,
  getServices,
  getSpareParts,
  getVehicles,
} from "../services/api";

function RoleOperationsDashboard({
  roleLabel,
  badgeLabel,
  headline,
  description,
  accent = "sky",
  focusAreas = [],
  quickActions = [],
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState({
    vehiclesCount: 0,
    servicesCount: 0,
    jobCardsCount: 0,
    sparePartsCount: 0,
    batteriesCount: 0,
    pendingServices: 0,
    recentItems: [],
  });

  const themeMode = localStorage.getItem("theme_mode") === "night" ? "night" : "day";
  const isNight = themeMode === "night";

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch (parseError) {
    currentUser = {};
  }

  const displayName = currentUser.name || currentUser.username || roleLabel;
  const firstName = displayName.split(" ")[0] || roleLabel;

  const accentStyles = useMemo(() => {
    const palette = {
      amber: {
        badge: isNight ? "bg-amber-400/10 text-amber-200" : "bg-amber-100 text-amber-700",
        button: "bg-amber-500 hover:bg-amber-600 text-white",
        pill: isNight ? "bg-amber-400/10 text-amber-200" : "bg-amber-50 text-amber-700",
      },
      emerald: {
        badge: isNight ? "bg-emerald-400/10 text-emerald-200" : "bg-emerald-100 text-emerald-700",
        button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        pill: isNight ? "bg-emerald-400/10 text-emerald-200" : "bg-emerald-50 text-emerald-700",
      },
      rose: {
        badge: isNight ? "bg-rose-400/10 text-rose-200" : "bg-rose-100 text-rose-700",
        button: "bg-rose-600 hover:bg-rose-700 text-white",
        pill: isNight ? "bg-rose-400/10 text-rose-200" : "bg-rose-50 text-rose-700",
      },
      sky: {
        badge: isNight ? "bg-cyan-400/10 text-cyan-200" : "bg-sky-100 text-sky-700",
        button: "bg-slate-950 hover:bg-slate-800 text-white",
        pill: isNight ? "bg-sky-400/10 text-sky-200" : "bg-sky-50 text-sky-700",
      },
    };

    return palette[accent] || palette.sky;
  }, [accent, isNight]);

  useEffect(() => {
    const loadRoleWorkspace = async () => {
      setLoading(true);
      setError("");

      try {
        const [vehiclesResult, servicesResult, jobCardsResult, sparePartsResult, batteriesResult] =
          await Promise.allSettled([
            getVehicles(),
            getServices(),
            getJobCards(),
            getSpareParts(),
            getBatteries(),
          ]);

        const vehicles =
          vehiclesResult.status === "fulfilled" && Array.isArray(vehiclesResult.value?.data)
            ? vehiclesResult.value.data
            : [];
        const services =
          servicesResult.status === "fulfilled" && Array.isArray(servicesResult.value?.data)
            ? servicesResult.value.data
            : [];
        const jobCards =
          jobCardsResult.status === "fulfilled" && Array.isArray(jobCardsResult.value?.data)
            ? jobCardsResult.value.data
            : [];
        const spareParts =
          sparePartsResult.status === "fulfilled" && Array.isArray(sparePartsResult.value?.data)
            ? sparePartsResult.value.data
            : [];
        const batteries =
          batteriesResult.status === "fulfilled" && Array.isArray(batteriesResult.value?.data)
            ? batteriesResult.value.data
            : [];

        const recentServices = services.slice(0, 3).map((service) => ({
          id: `service-${service.service_id}`,
          type: "Service",
          title: service.vehicle_model || `Vehicle #${service.vehicle_id}`,
          detail: service.service_type || "Workshop service",
          status: service.status || "Pending",
          date: service.service_date,
        }));

        const recentJobCards = jobCards.slice(0, 3).map((jobCard) => ({
          id: `job-${jobCard.job_id}`,
          type: "Job Card",
          title: jobCard.vehicle_model || `Vehicle #${jobCard.vehicle_id}`,
          detail: jobCard.remarks || "Workshop job card",
          status: jobCard.status || "Pending",
          date: jobCard.service_date || jobCard.created_at,
        }));

        setWorkspace({
          vehiclesCount: vehicles.length,
          servicesCount: services.length,
          jobCardsCount: jobCards.length,
          sparePartsCount: spareParts.length,
          batteriesCount: batteries.length,
          pendingServices: services.filter((service) => {
            const status = String(service.status || "").toLowerCase();
            return status === "pending" || status === "in progress";
          }).length,
          recentItems: [...recentServices, ...recentJobCards]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 5),
        });

        if (
          vehiclesResult.status === "rejected" &&
          servicesResult.status === "rejected" &&
          jobCardsResult.status === "rejected" &&
          sparePartsResult.status === "rejected" &&
          batteriesResult.status === "rejected"
        ) {
          setError(`Unable to load the ${roleLabel.toLowerCase()} workspace.`);
        }
      } catch (requestError) {
        console.error(`${roleLabel} dashboard load error:`, requestError);
        setError(`Unable to load the ${roleLabel.toLowerCase()} workspace.`);
      } finally {
        setLoading(false);
      }
    };

    loadRoleWorkspace();
  }, [roleLabel]);

  const formatDate = (value) => {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "completed" || normalized === "delivered") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (normalized === "in progress") {
      return "bg-sky-100 text-sky-700";
    }

    return "bg-amber-100 text-amber-700";
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("auth_token");

    try {
      if (token) {
        await fetch("http://localhost:5000/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (logoutError) {
      console.error("Logout tracking failed:", logoutError);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
  };

  const toggleTheme = () => {
    const nextTheme = isNight ? "day" : "night";
    localStorage.setItem("theme_mode", nextTheme);
    document.body.classList.remove("theme-day", "theme-night");
    document.body.classList.add(nextTheme === "night" ? "theme-night" : "theme-day");
    window.location.reload();
  };

  const summaryCards = [
    {
      label: "Vehicles",
      value: workspace.vehiclesCount,
      helper: "Tracked workshop vehicles.",
      icon: FaCar,
    },
    {
      label: "Service Entries",
      value: workspace.servicesCount,
      helper: "Current service records in the system.",
      icon: FaTools,
    },
    {
      label: "Job Cards",
      value: workspace.jobCardsCount,
      helper: "Open and completed work items.",
      icon: FaClipboardList,
    },
    {
      label: "Active Queue",
      value: workspace.pendingServices,
      helper: "Pending or in-progress services.",
      icon: FaClock,
    },
  ];

  const supportCards = [
    {
      label: "Spare Parts",
      value: workspace.sparePartsCount,
      icon: FaBoxes,
    },
    {
      label: "Batteries",
      value: workspace.batteriesCount,
      icon: FaWrench,
    },
  ];

  return (
    <div
      className={`min-h-[calc(100vh-56px)] px-4 py-6 sm:px-6 lg:px-8 ${
        isNight
          ? "bg-[radial-gradient(circle_at_top,#172554,transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
          : "bg-[radial-gradient(circle_at_top,#dbeafe,transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)]"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <section
          className={`overflow-hidden rounded-[32px] border px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:px-8 lg:px-10 ${
            isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/70 bg-white/85 text-slate-900"
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div
                className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${accentStyles.badge}`}
              >
                {badgeLabel}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {headline.replace("{firstName}", firstName)}
              </h1>
              <p className={`mt-4 max-w-2xl text-base leading-7 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                {description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {quickActions.slice(0, 2).map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${accentStyles.button}`}
                  >
                    {item.title}
                    <FaArrowRight />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-[28px] border p-5 ${
                isNight ? "border-white/10 bg-white/5" : "border-slate-200/70 bg-slate-50/90"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Signed in as</div>
                  <div className="mt-2 text-2xl font-semibold">{displayName}</div>
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${accentStyles.pill}`}>
                    {roleLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                    isNight ? "border-white/10 bg-white/5 text-amber-200" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  aria-label="Toggle theme"
                >
                  {isNight ? <FaSun /> : <FaMoon />}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {focusAreas.map((item) => (
                  <div
                    key={item}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      isNight ? "border-white/10 bg-slate-900/70 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <FaPowerOff />
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className={`rounded-[28px] border p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ${
                  isNight ? "border-white/10 bg-slate-950/75 text-white" : "border-white/80 bg-white/90 text-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">{card.label}</div>
                    <div className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{card.value}</div>
                  </div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentStyles.pill}`}>
                    <Icon />
                  </div>
                </div>
                <p className={`mt-4 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                  {card.helper}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article
            className={`rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
              isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/80 bg-white/90 text-slate-900"
            }`}
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Quick Actions</h2>
              <p className={`mt-2 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                Jump into the modules this role uses most often.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {quickActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 ${
                    isNight ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-lg font-semibold">{item.title}</div>
                    <FaArrowRight className={isNight ? "text-slate-400" : "text-slate-500"} />
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </article>

          <article
            className={`rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
              isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/80 bg-white/90 text-slate-900"
            }`}
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Recent Activity</h2>
              <p className={`mt-2 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                Latest services and job cards in a role-focused workspace.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className={`rounded-2xl border px-4 py-5 text-sm ${isNight ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  Loading workspace activity...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                  {error}
                </div>
              ) : workspace.recentItems.length > 0 ? (
                workspace.recentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-4 ${
                      isNight ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {item.type}
                        </div>
                        <div className="mt-1 text-base font-semibold">{item.title}</div>
                        <div className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                          {item.detail}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                        <div className="mt-2 text-xs text-slate-500">{formatDate(item.date)}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`rounded-2xl border px-4 py-5 text-sm ${isNight ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  No recent service or job card activity yet.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {supportCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className={`rounded-2xl border px-4 py-4 ${
                      isNight ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-500">{card.label}</div>
                        <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                      </div>
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accentStyles.pill}`}>
                        <Icon />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export default RoleOperationsDashboard;
