// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import DeletedVehicleList from "./components/DeletedVehicleList";
import "./theme.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("auth_token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("auth_token");
  const role = localStorage.getItem("auth_role");
  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin" && role !== "super_admin") return <Navigate to="/" replace />;
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

function AppLayout() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme_mode");
    if (storedTheme === "day" || storedTheme === "night") return storedTheme;
    return "day";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.remove("theme-day", "theme-night");
    document.body.classList.add(theme === "night" ? "theme-night" : "theme-day");
    localStorage.setItem("theme_mode", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "night" ? "day" : "night"));
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
  };

  const isLoggedIn = !!localStorage.getItem("auth_token");
  const role = localStorage.getItem("auth_role");
  const isAdmin = role === "admin" || role === "super_admin";
  const themeToggleLabel = useMemo(
    () => (theme === "night" ? "Day Mode" : "Night Mode"),
    [theme]
  );
  const navShellClass =
    theme === "night"
      ? "border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800"
      : "bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-500";

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <nav className={`${navShellClass} animate-fade-in`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-white">
            Vehicle Service System
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
              onClick={toggleTheme}
            >
              {themeToggleLabel}
            </button>
            {isLoggedIn && (
              <>
                <NavLinkItem to="/">Dashboard</NavLinkItem>
                <NavLinkItem to="/vehicles">Vehicles</NavLinkItem>
                <NavLinkItem to="/services">Services</NavLinkItem>
                <NavLinkItem to="/job-cards">Job Cards</NavLinkItem>
                {isAdmin && <NavLinkItem to="/admin/users">Admin</NavLinkItem>}
                <button
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                  onClick={handleLogout}
                >
                  Logout
                </button>
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
              {isLoggedIn && (
                <>
                  <NavLinkItem to="/" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </NavLinkItem>
                  <NavLinkItem to="/vehicles" onClick={() => setMobileMenuOpen(false)}>
                    Vehicles
                  </NavLinkItem>
                  <NavLinkItem to="/services" onClick={() => setMobileMenuOpen(false)}>
                    Services
                  </NavLinkItem>
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
              )}
            </div>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
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
