import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBatteryThreeQuarters,
  FaBoxOpen,
  FaCar,
  FaClipboardList,
  FaMoon,
  FaPowerOff,
  FaSun,
  FaTools,
  FaUsers,
} from "react-icons/fa";
import {
  getAdminUsers,
  getBatteries,
  getJobCards,
  getServices,
  getSpareParts,
  getVehicles,
} from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [jobCardsCount, setJobCardsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentOps, setRecentOps] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const themeMode = localStorage.getItem("theme_mode") === "night" ? "night" : "day";
  const isNight = themeMode === "night";

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch (parseError) {
    currentUser = {};
  }

  const displayName = currentUser.name || currentUser.username || "Admin";
  const firstName = displayName.split(" ")[0] || "Admin";

  useEffect(() => {
    const loadAdminWorkspace = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          vehiclesResult,
          servicesResult,
          jobCardsResult,
          sparePartsResult,
          batteriesResult,
          adminUsersResult,
        ] = await Promise.allSettled([
          getVehicles(),
          getServices(),
          getJobCards(),
          getSpareParts(),
          getBatteries(),
          getAdminUsers(),
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
        const adminUsers =
          adminUsersResult.status === "fulfilled" && Array.isArray(adminUsersResult.value?.data)
            ? adminUsersResult.value.data
            : [];

        setVehiclesCount(vehicles.length);
        setServicesCount(services.length);
        setJobCardsCount(jobCards.length);
        setLowStockCount(
          spareParts.filter((item) => Number(item.stock_qty || 0) <= 5).length +
            batteries.filter((item) => Number(item.stock_qty || 0) <= 5).length
        );
        setStaffUsers(
          adminUsers
            .filter((user) => user.role === "staff")
            .sort((a, b) => {
              const aActive = Number(Boolean(a.is_active));
              const bActive = Number(Boolean(b.is_active));
              if (aActive !== bActive) return bActive - aActive;
              return String(a.name || a.username || "").localeCompare(String(b.name || b.username || ""));
            })
        );

        const recentServices = services.slice(0, 4).map((service) => ({
          id: `service-${service.service_id}`,
          type: "Service",
          title: service.vehicle_model || `Vehicle #${service.vehicle_id}`,
          detail: service.service_type || "Workshop service",
          status: service.status || "Pending",
          date: service.service_date,
        }));

        const recentJobs = jobCards.slice(0, 4).map((jobCard) => ({
          id: `job-${jobCard.job_id}`,
          type: "Job Card",
          title: jobCard.vehicle_model || `Vehicle #${jobCard.vehicle_id}`,
          detail: jobCard.remarks || "Workshop job card",
          status: jobCard.status || "Pending",
          date: jobCard.service_date || jobCard.created_at,
        }));

        setRecentOps(
          [...recentServices, ...recentJobs]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 6)
        );

        if (
          vehiclesResult.status === "rejected" &&
          servicesResult.status === "rejected" &&
          jobCardsResult.status === "rejected"
        ) {
          setError("Unable to load admin workspace.");
        }
      } catch (requestError) {
        console.error("Admin dashboard load error:", requestError);
        setError("Unable to load admin workspace.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminWorkspace();
  }, []);

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

  const overviewCards = useMemo(
    () => [
      {
        label: "Vehicle Records",
        value: vehiclesCount,
        helper: "Current vehicles in the system.",
        icon: FaCar,
      },
      {
        label: "Service Queue",
        value: servicesCount,
        helper: "Total workshop services tracked.",
        icon: FaTools,
      },
      {
        label: "Job Cards",
        value: jobCardsCount,
        helper: "Cards available for operations follow-up.",
        icon: FaClipboardList,
      },
      {
        label: "Low Stock Alerts",
        value: lowStockCount,
        helper: "Parts and batteries that need review.",
        icon: FaBoxOpen,
      },
    ],
    [jobCardsCount, lowStockCount, servicesCount, vehiclesCount]
  );

  const quickActions = [
    {
      title: "Review Services",
      description: "Open the admin service review page and monitor the service queue.",
      action: () => navigate("/admin/review-services"),
      icon: FaTools,
    },
    {
      title: "Review Team Access",
      description: "Open user list and monitor roles, status, and activity.",
      action: () => navigate("/admin/users"),
      icon: FaUsers,
    },
    {
      title: "Check Spare Parts",
      description: "Review parts inventory and catch stock issues early.",
      action: () => navigate("/admin/review-spare-parts"),
      icon: FaBoxOpen,
    },
    {
      title: "Check Batteries",
      description: "Open battery inventory and verify low-stock items.",
      action: () => navigate("/admin/review-batteries"),
      icon: FaBatteryThreeQuarters,
    },
  ];

  const staffFlow = useMemo(() => {
    const activeStaff = staffUsers.filter((user) => Boolean(user.is_active));
    const inactiveStaff = staffUsers.filter((user) => !Boolean(user.is_active));
    const recentlyActiveStaff = [...activeStaff]
      .sort((a, b) => new Date(b.last_login_at || 0) - new Date(a.last_login_at || 0))
      .slice(0, 4);

    return {
      total: staffUsers.length,
      active: activeStaff.length,
      inactive: inactiveStaff.length,
      recentlyActiveStaff,
    };
  }, [staffUsers]);

  const formatDateTime = (value) => {
    if (!value) return "No login recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  return (
    <div
      className={`min-h-[calc(100vh-56px)] px-4 py-6 sm:px-6 lg:px-8 ${
        isNight
          ? "bg-[radial-gradient(circle_at_top,#1d4ed8,transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
          : "bg-[radial-gradient(circle_at_top,#dbeafe,transparent_28%),linear-gradient(180deg,#f8fbff_0%,#edf6ff_100%)]"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <section
          className={`overflow-hidden rounded-[34px] border px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:px-8 lg:px-10 ${
            isNight ? "border-white/10 bg-slate-950/85 text-white" : "border-white/70 bg-white/90 text-slate-900"
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div
                className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
                  isNight ? "bg-blue-400/10 text-blue-200" : "bg-blue-100 text-blue-700"
                }`}
              >
                Admin Operations Desk
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Welcome back, {firstName}. This workspace is tuned for admin operations.
              </h1>
              <p className={`mt-4 max-w-2xl text-base leading-7 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                You can track daily workshop flow, monitor stock alerts, and review user activity without the super admin executive layout.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/users")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open Admin Users
                  <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/review-services")}
                  className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                    isNight
                      ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Review Services
                </button>
              </div>
            </div>

            <div className={`rounded-[28px] border p-6 ${isNight ? "border-blue-400/15 bg-white/5" : "border-sky-100 bg-sky-50/80"}`}>
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

              <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${isNight ? "text-blue-200" : "text-sky-700"}`}>
                Staff Status Flow
              </div>
              <div className="mt-5 space-y-4">
                <div className={`rounded-2xl border p-4 ${isNight ? "border-white/10 bg-slate-900/70" : "border-white bg-white"}`}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                        Total Staff
                      </div>
                      <div className="mt-2 text-3xl font-semibold">{staffFlow.total}</div>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "text-emerald-300" : "text-emerald-700"}`}>
                        Active
                      </div>
                      <div className="mt-2 text-3xl font-semibold text-emerald-500">{staffFlow.active}</div>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "text-rose-300" : "text-rose-700"}`}>
                        Inactive
                      </div>
                      <div className="mt-2 text-3xl font-semibold text-rose-500">{staffFlow.inactive}</div>
                    </div>
                  </div>
                  <div className={`mt-4 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                    Active staff can access the staff workspace and continue workshop tasks. Inactive staff are blocked at login until a super admin reactivates them.
                  </div>
                </div>

                {staffUsers.length > 0 ? (
                  staffUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.user_id}
                      className={`rounded-2xl border p-4 ${isNight ? "border-white/10 bg-slate-900/70" : "border-white bg-white"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">
                            {user.name || user.username}
                          </div>
                          <div className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                            {user.username}
                          </div>
                          <div className={`mt-1 text-xs ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                            Last login: {formatDateTime(user.last_login_at)}
                          </div>
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            Boolean(user.is_active)
                              ? isNight
                                ? "bg-emerald-400/15 text-emerald-200"
                                : "bg-emerald-100 text-emerald-700"
                              : isNight
                                ? "bg-rose-400/15 text-rose-200"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {Boolean(user.is_active) ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`rounded-2xl border p-4 text-sm ${isNight ? "border-white/10 bg-slate-900/70 text-slate-300" : "border-white bg-white text-slate-600"}`}>
                    No staff users found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map(({ label, value, helper, icon: Icon }) => (
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
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isNight ? "bg-white/10 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                  <Icon />
                </div>
              </div>
              <div className={`mt-4 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>{helper}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div
            className={`rounded-[30px] border p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
              isNight ? "border-white/10 bg-slate-950/80 text-white" : "border-white/70 bg-white/90 text-slate-900"
            }`}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Admin Quick Actions</h2>
            <p className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              Features grouped around admin-level review and coordination.
            </p>

            <div className="mt-6 space-y-4">
              {quickActions.map(({ title, description, action, icon: Icon }) => (
                <button
                  key={title}
                  type="button"
                  onClick={action}
                  className={`flex w-full items-center justify-between rounded-[24px] border px-5 py-5 text-left transition hover:-translate-y-0.5 ${
                    isNight ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-11 w-11 items-center justify-center rounded-2xl ${isNight ? "bg-white/10 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                      <Icon />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{title}</div>
                      <div className={`mt-1 text-sm leading-6 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                        {description}
                      </div>
                    </div>
                  </div>
                  <FaArrowRight className={isNight ? "text-blue-200" : "text-blue-700"} />
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
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Recent Operations</h2>
              <p className={`mt-1 text-sm ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                Latest service and job card movement for admin review.
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
                        Loading admin activity...
                      </td>
                    </tr>
                  ) : recentOps.length > 0 ? (
                    recentOps.map((item) => (
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
                        No recent admin activity found.
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

export default AdminDashboard;
