import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCar,
  FaClipboardList,
  FaClock,
  FaMoon,
  FaPowerOff,
  FaSun,
  FaTools,
  FaWrench,
} from "react-icons/fa";
import { getJobCards, getServices, getVehicles } from "../services/api";

function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [jobCardsCount, setJobCardsCount] = useState(0);
  const [pendingServices, setPendingServices] = useState(0);
  const [recentItems, setRecentItems] = useState([]);

  const themeMode = localStorage.getItem("theme_mode") === "night" ? "night" : "day";
  const isNight = themeMode === "night";

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch (parseError) {
    currentUser = {};
  }

  const displayName = currentUser.name || currentUser.username || "Staff";
  const firstName = displayName.split(" ")[0] || "Staff";

  const toggleTheme = () => {
    const nextTheme = isNight ? "day" : "night";
    localStorage.setItem("theme_mode", nextTheme);
    document.body.classList.remove("theme-day", "theme-night");
    document.body.classList.add(nextTheme === "night" ? "theme-night" : "theme-day");
    window.location.reload();
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

  useEffect(() => {
    const loadStaffWorkspace = async () => {
      setLoading(true);
      setError("");

      try {
        const [vehiclesResult, servicesResult, jobCardsResult] = await Promise.allSettled([
          getVehicles(),
          getServices(),
          getJobCards(),
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

        setVehiclesCount(vehicles.length);
        setServicesCount(services.length);
        setJobCardsCount(jobCards.length);
        setPendingServices(
          services.filter((service) => {
            const status = String(service.status || "").toLowerCase();
            return status === "pending" || status === "in progress";
          }).length
        );

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

        setRecentItems(
          [...recentServices, ...recentJobCards]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 5)
        );

        if (
          vehiclesResult.status === "rejected" &&
          servicesResult.status === "rejected" &&
          jobCardsResult.status === "rejected"
        ) {
          setError("Unable to load staff workspace.");
        }
      } catch (requestError) {
        console.error("Staff dashboard load error:", requestError);
        setError("Unable to load staff workspace.");
      } finally {
        setLoading(false);
      }
    };

    loadStaffWorkspace();
  }, []);

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

  const summaryCards = useMemo(
    () => [
      {
        label: "Vehicles",
        value: vehiclesCount,
        helper: "Registered vehicles ready for service tracking.",
        icon: FaCar,
      },
      {
        label: "Service Entries",
        value: servicesCount,
        helper: "All logged workshop services.",
        icon: FaTools,
      },
      {
        label: "Job Cards",
        value: jobCardsCount,
        helper: "Open and completed workshop jobs.",
        icon: FaClipboardList,
      },
      {
        label: "Active Queue",
        value: pendingServices,
        helper: "Pending or in-progress services needing attention.",
        icon: FaClock,
      },
    ],
    [jobCardsCount, pendingServices, servicesCount, vehiclesCount]
  );

  const quickActions = [
    {
      title: "Vehicle Records",
      description: "Review vehicle history and current workshop entries.",
      action: () => navigate("/vehicles"),
    },
    {
      title: "Service Desk",
      description: "Update service progress and keep current jobs moving.",
      action: () => navigate("/services"),
    },
    {
      title: "Job Card Board",
      description: "Open the latest job cards and continue active work.",
      action: () => navigate("/job-cards"),
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
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <div
                className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
                  isNight ? "bg-cyan-400/10 text-cyan-200" : "bg-sky-100 text-sky-700"
                }`}
              >
                Staff Workspace
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Welcome, {firstName}. This dashboard is tailored for daily workshop work.
              </h1>
              <p className={`mt-4 max-w-2xl text-base leading-7 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                Focus on vehicles, live service entries, and job cards without the admin controls and analytics-heavy layout.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/services")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open Service Desk
                  <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/job-cards")}
                  className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                    isNight
                      ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  View Job Cards
                </button>
              </div>
            </div>

            <div
              className={`rounded-[28px] border p-6 ${
                isNight ? "border-cyan-400/15 bg-white/5" : "border-sky-100 bg-sky-50/80"
              }`}
            >
              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    isNight
                      ? "bg-white/10 text-white hover:bg-white/15"
                      : "bg-white text-slate-800 shadow-sm hover:bg-slate-50"
                  }`}
                >
                  {isNight ? <FaSun /> : <FaMoon />}
                  {isNight ? "Day Mode" : "Night Mode"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  <FaPowerOff />
                  Logout
                </button>
              </div>
              <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${isNight ? "text-cyan-200" : "text-sky-700"}`}>
                Today&apos;s Focus
              </div>
              <div className="mt-5 space-y-4">
                <div className={`rounded-2xl border p-4 ${isNight ? "border-white/10 bg-slate-900/70" : "border-white bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isNight ? "bg-amber-400/10 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                      <FaWrench />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{pendingServices}</div>
                      <div className={isNight ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
                        Services currently waiting or in progress
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 ${isNight ? "border-white/10 bg-slate-900/70" : "border-white bg-white"}`}>
                  <div className="text-sm font-medium">Staff route</div>
                  <div className={`mt-2 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                    Start with services, then move to job cards, and review vehicles whenever a customer record needs verification.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, helper, icon: Icon }) => (
            <div
              key={label}
              className={`rounded-[28px] border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
                isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/70 bg-white/90 text-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={isNight ? "text-sm text-slate-300" : "text-sm text-slate-500"}>{label}</div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{value}</div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isNight ? "bg-white/10 text-cyan-200" : "bg-sky-100 text-sky-700"}`}>
                  <Icon />
                </div>
              </div>
              <div className={`mt-4 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>{helper}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div
            className={`rounded-[30px] border p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
              isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/70 bg-white/90 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">Quick Actions</h2>
                <p className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                  Staff tools grouped for day-to-day workshop tasks.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {quickActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className={`flex w-full items-center justify-between rounded-[24px] border px-5 py-5 text-left transition hover:-translate-y-0.5 ${
                    isNight ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <div className="text-lg font-semibold">{item.title}</div>
                    <div className={`mt-1 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                      {item.description}
                    </div>
                  </div>
                  <FaArrowRight className={isNight ? "text-cyan-200" : "text-sky-700"} />
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-[30px] border shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
              isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/70 bg-white/90 text-slate-900"
            }`}
          >
            <div className={`border-b px-6 py-5 ${isNight ? "border-white/10" : "border-slate-100"}`}>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Recent Workshop Activity</h2>
              <p className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                Latest service and job card items in a simpler staff-focused view.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className={isNight ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-500"}>
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium">Type</th>
                    <th className="px-6 py-4 text-sm font-medium">Vehicle</th>
                    <th className="px-6 py-4 text-sm font-medium">Details</th>
                    <th className="px-6 py-4 text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-sm font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className={isNight ? "divide-y divide-white/10" : "divide-y divide-slate-100"}>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className={`px-6 py-10 text-center text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                        Loading staff activity...
                      </td>
                    </tr>
                  ) : recentItems.length > 0 ? (
                    recentItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm font-medium">{item.type}</td>
                        <td className="px-6 py-4 text-sm">{item.title}</td>
                        <td className={`px-6 py-4 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>{item.detail}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                          {formatDate(item.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={`px-6 py-10 text-center text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                        No recent service or job card activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="px-6 pb-6 pt-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default StaffDashboard;
