// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

import VehicleList from "./components/VehicleList";
import ServiceList from "./components/serviceList";
import JobCards from "./components/JobCards";
import AdminUsers from "./components/AdminUsers";
import AdminDashboard from "./components/AdminDashboard";
import AdminReviewServices from "./components/AdminReviewServices";
import AdminReviewSpareParts from "./components/AdminReviewSpareParts";
import AdminReviewBatteries from "./components/AdminReviewBatteries";
import Dashboard from "./components/Dashboard";
import StaffDashboard from "./components/StaffDashboard";
import Login from "./components/Login";
import DeletedVehicleList from "./components/DeletedVehicleList";
import HomePage from "./components/HomePage";
import SpareParts from "./components/SpareParts";
import Batteries from "./components/Batteries";
import Reports from "./components/Reports";
import Customers from "./components/Customers";
import logoMark from "./assets/vehicleops-logo.svg";
import { clearStoredAuth } from "./services/api";
import "./theme.css";

function hasValidAuthToken() {
  const token = localStorage.getItem("auth_token");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      clearStoredAuth();
      return false;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded));

    if (payload?.exp && payload.exp * 1000 <= Date.now()) {
      clearStoredAuth();
      return false;
    }

    return true;
  } catch (error) {
    clearStoredAuth();
    return false;
  }
}

function ProtectedRoute({ children }) {
  const token = hasValidAuthToken();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = hasValidAuthToken();
  const role = localStorage.getItem("auth_role");
  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin" && role !== "super_admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function NavLinkItem({ to, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition",
        isActive
          ? "bg-white/20 text-white shadow-sm"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function InventoryMenu({ mobile = false, onNavigate }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const items = [
    { to: "/spare-parts", label: "Spare Parts" },
    { to: "/batteries", label: "Batteries" },
  ];
  const isActive = items.some((item) => location.pathname === item.to);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open || mobile) return undefined;

    const handleClickOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [mobile, open]);

  if (mobile) {
    return (
      <div className="rounded-2xl border border-white/10">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>Inventory</span>
          <span>{open ? "-" : "+"}</span>
        </button>
        {open && (
          <div className="border-t border-white/10 px-2 py-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-xl px-3 py-2 text-sm transition ${
                  location.pathname === item.to
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
          isActive
            ? "bg-white/20 text-white shadow-sm"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        Inventory
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </button>
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-30 min-w-[220px] -translate-x-1/2 rounded-[22px] border border-white/15 bg-slate-950/95 p-2 shadow-[0_20px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-[16px] px-4 py-3 text-sm transition ${
                location.pathname === item.to
                  ? "bg-white/12 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme_mode");
    if (storedTheme === "day" || storedTheme === "night") return storedTheme;
    return "day";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState(null);

  useEffect(() => {
    document.body.classList.remove("theme-day", "theme-night");
    document.body.classList.add(theme === "night" ? "theme-night" : "theme-day");
    localStorage.setItem("theme_mode", theme);
  }, [theme]);

  useEffect(() => {
    const rawNotice = sessionStorage.getItem("login_notice");
    if (!rawNotice) return undefined;

    try {
      const parsedNotice = JSON.parse(rawNotice);
      setLoginNotice(parsedNotice);
      sessionStorage.removeItem("login_notice");
    } catch (error) {
      sessionStorage.removeItem("login_notice");
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLoginNotice(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "night" ? "day" : "night"));
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
    } catch (error) {
      console.error("Logout tracking failed:", error);
    } finally {
      clearStoredAuth();
      window.location.href = "/login";
    }
  };

  const isLoggedIn = hasValidAuthToken();
  const role = localStorage.getItem("auth_role");
  const isAdmin = role === "admin" || role === "super_admin";
  const dashboardLabelMap = {
    staff: "Staff Desk",
    admin: "Admin Desk",
  };
  const dashboardLabel = dashboardLabelMap[role] || "Dashboard";
  const isDashboardRoute = isLoggedIn && location.pathname === "/dashboard";
  const themeToggleLabel = useMemo(
    () => (theme === "night" ? "Day Mode" : "Night Mode"),
    [theme]
  );
  const noticeTone = useMemo(() => {
    if (!loginNotice) return null;

    if (loginNotice.role === "super_admin") {
      return {
        shell: "border-amber-200 bg-white/95",
        title: "text-amber-700",
        badge: "bg-amber-100 text-amber-800 border border-amber-200",
      };
    }

    if (loginNotice.role === "admin") {
      return {
        shell: "border-sky-200 bg-white/95",
        title: "text-sky-700",
        badge: "bg-sky-100 text-sky-800 border border-sky-200",
      };
    }

    return {
      shell: "border-emerald-200 bg-white/95",
      title: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    };
  }, [loginNotice]);
  const navShellClass =
    theme === "night"
      ? "border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800"
      : "bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-500";

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      {loginNotice && (
        <div className="fixed right-4 top-20 z-[90] w-[min(92vw,24rem)] animate-fade-up">
          <div
            className={`rounded-[24px] border px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur ${noticeTone?.shell}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-sm font-semibold ${noticeTone?.title}`}>Login successful</div>
                <div className="mt-2 text-sm text-slate-700">
                  Logged in as{" "}
                  <span className="font-semibold">{loginNotice.name || loginNotice.username}</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setLoginNotice(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {loginNotice.username}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${noticeTone?.badge}`}>
                {loginNotice.role}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              You are now using the permissions for this role.
            </div>
          </div>
        </div>
      )}
      {!isDashboardRoute && (
        <nav className={`${navShellClass} relative z-50 animate-fade-in`}>
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6">
            <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-3 text-white">
              <img src={logoMark} alt="VehicleOps logo" className="h-10 w-10 rounded-2xl" />
              <span className="text-lg font-semibold tracking-tight">VehicleOps</span>
            </Link>

            <div className="ml-auto hidden flex-wrap items-center justify-end gap-2 lg:flex">
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                onClick={toggleTheme}
              >
                {themeToggleLabel}
              </button>
              {isLoggedIn ? (
                <>
                  <NavLinkItem to="/dashboard">{dashboardLabel}</NavLinkItem>
                  <NavLinkItem to="/vehicles">Vehicles</NavLinkItem>
                  <NavLinkItem to="/customers">Customers</NavLinkItem>
                  <NavLinkItem to="/services">Services</NavLinkItem>
                  <InventoryMenu />
                  <NavLinkItem to="/job-cards">Job Cards</NavLinkItem>
                  {isAdmin && <NavLinkItem to="/admin/users">Admin</NavLinkItem>}
                  <button
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Home
                  </Link>
                  <a
                    href="/#about"
                    className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    About Us
                  </a>
                  <Link
                    to="/login"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation"
            >
              <span className="text-xl leading-none">{mobileMenuOpen ? "x" : "="}</span>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="animate-fade-up border-t border-white/10 px-4 pb-4 lg:hidden">
              <div className="flex flex-col gap-2 pt-4">
                <button
                  className="rounded-2xl border border-white/20 px-4 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                  onClick={toggleTheme}
                >
                  {themeToggleLabel}
                </button>
                {isLoggedIn ? (
                  <>
                    <NavLinkItem to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      {dashboardLabel}
                    </NavLinkItem>
                    <NavLinkItem to="/vehicles" onClick={() => setMobileMenuOpen(false)}>
                      Vehicles
                    </NavLinkItem>
                    <NavLinkItem to="/customers" onClick={() => setMobileMenuOpen(false)}>
                      Customers
                    </NavLinkItem>
                    <NavLinkItem to="/services" onClick={() => setMobileMenuOpen(false)}>
                      Services
                    </NavLinkItem>
                    <InventoryMenu mobile onNavigate={() => setMobileMenuOpen(false)} />
                    <NavLinkItem to="/job-cards" onClick={() => setMobileMenuOpen(false)}>
                      Job Cards
                    </NavLinkItem>
                    {isAdmin && (
                      <NavLinkItem to="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                        Admin
                      </NavLinkItem>
                    )}
                    <button
                      className="rounded-2xl bg-rose-500 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-rose-600"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <a
                      href="/#about"
                      className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About Us
                    </a>
                    <Link
                      to="/login"
                      className="rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {role === "staff" ? (
                <StaffDashboard />
              ) : role === "admin" ? (
                <AdminDashboard />
              ) : (
                <Dashboard />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <VehicleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deleted"
          element={
            <ProtectedRoute>
              <DeletedVehicleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spare-parts"
          element={
            <ProtectedRoute>
              <SpareParts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batteries"
          element={
            <ProtectedRoute>
              <Batteries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-cards"
          element={
            <ProtectedRoute>
              <JobCards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review-services"
          element={
            <AdminRoute>
              <AdminReviewServices />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review-spare-parts"
          element={
            <AdminRoute>
              <AdminReviewSpareParts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review-batteries"
          element={
            <AdminRoute>
              <AdminReviewBatteries />
            </AdminRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
