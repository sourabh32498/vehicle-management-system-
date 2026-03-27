// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaSignInAlt, FaUser } from "react-icons/fa";
import { loginUser } from "../services/api";
import logoMark from "../assets/vehicleops-logo.svg";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const response = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });

      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token || !user) {
        setError("Invalid login response from server.");
        return;
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_role", user.role);
      localStorage.setItem("auth_user", JSON.stringify(user));
      sessionStorage.setItem(
        "login_notice",
        JSON.stringify({
          name: user.name,
          username: user.username,
          role: user.role,
        })
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-loginHero px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-56px-5rem)] max-w-6xl items-center justify-center">
        <div className="animate-fade-up grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/40 bg-white/55 shadow-softxl backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-950 px-10 py-12 text-slate-50 md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-inset ring-cyan-300/30">
                <FaLock className="text-xl" />
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
                Vehicle Service System
              </p>
              <h1 className="max-w-sm text-4xl font-semibold leading-tight">
                Control fleet operations from one secure dashboard.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Monitor service schedules, maintenance records, and admin activity with a single login.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Centralized service records and role-based access.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Built for quick admin workflows on desktop and mobile.
              </div>
            </div>
          </section>

          <section className="bg-surface px-6 py-8 sm:px-8 md:px-10 md:py-12">
            <div className="mx-auto w-full max-w-md">
              <div className="animate-fade-up animate-delay-1 mb-8 text-center md:text-left">
                <div className="mx-auto mb-4 flex items-center gap-4 md:mx-0">
                  <img src={logoMark} alt="VehicleOps logo" className="h-14 w-14 rounded-2xl" />
                  <div className="hidden sm:block">
                    <div className="text-lg font-semibold tracking-tight text-textPrimary">VehicleOps</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-textMuted">Workshop Software</div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-textPrimary">Welcome back</h2>
                <p className="mt-2 text-sm text-textMuted">
                  Sign in to continue to the admin workspace.
                </p>
              </div>

              {error && (
                <div
                  className="animate-fade-up mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="animate-fade-up animate-delay-2 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-textPrimary">Username</label>
                  <div className="flex items-center rounded-2xl border border-borderSoft bg-white px-4 shadow-sm transition focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                    <FaUser className="mr-3 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      className="w-full border-0 bg-transparent py-3.5 text-sm text-textPrimary outline-none placeholder:text-slate-400"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-textPrimary">Password</label>
                  <div className="flex items-center rounded-2xl border border-borderSoft bg-white px-4 shadow-sm transition focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                    <FaLock className="mr-3 shrink-0 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      className="w-full border-0 bg-transparent py-3.5 text-sm text-textPrimary outline-none placeholder:text-slate-400"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  <FaSignInAlt className="mr-2" />
                  Login
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
