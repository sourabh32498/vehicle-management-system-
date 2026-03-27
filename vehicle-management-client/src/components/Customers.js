import React, { useEffect, useMemo, useState } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaPlus, FaSearch, FaSyncAlt, FaUsers } from "react-icons/fa";
import { createCustomer, getCustomers } from "../services/api";

const panelClass =
  "overflow-hidden rounded-[24px] border border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
  });

  const isNight = document.body.classList.contains("theme-night");

  const fetchCustomers = async () => {
    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const response = await getCustomers();
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setFeedback({
        type: "danger",
        message:
          error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to load customers.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddCustomer = async () => {
    setFeedback({ type: "", message: "" });

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    if (!payload.name) {
      setFeedback({ type: "warning", message: "Customer name is required." });
      return;
    }

    setSaving(true);

    try {
      const response = await createCustomer(payload);
      const createdCustomer = response.data?.customer;

      setCustomers((current) =>
        createdCustomer ? [createdCustomer, ...current] : current
      );
      setForm({ name: "", mobile: "", email: "", address: "" });
      setFeedback({
        type: "success",
        message: response.data?.message || "Customer added successfully.",
      });

      if (!createdCustomer) {
        await fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
      setFeedback({
        type: "danger",
        message:
          error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to add customer.",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.mobile, customer.email, customer.address]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalized))
    );
  }, [customers, query]);

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
  const inputClass = isNight
    ? "rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20"
    : "rounded-2xl border border-[#dbe3f0] bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";
  const searchShellClass = isNight
    ? "border-[var(--border-color)] bg-[var(--surface-1)] focus-within:border-sky-400 focus-within:ring-sky-500/20"
    : "border-[#dbe3f0] bg-white focus-within:border-sky-500 focus-within:ring-sky-100";
  const tableRowHover = isNight ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";
  const feedbackClassMap = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: FaUsers,
      iconClass: isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    },
    {
      label: "Visible Results",
      value: filteredCustomers.length,
      icon: FaSearch,
      iconClass: isNight ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    },
    {
      label: "With Address",
      value: customers.filter((customer) => String(customer.address || "").trim()).length,
      icon: FaMapMarkerAlt,
      iconClass: isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    },
  ];

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
              Customer Directory
            </div>
            <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isNight ? "text-white" : "text-slate-950"}`}>
              Keep customer details clear, organized, and easy to review.
            </h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${isNight ? "text-slate-300" : "text-slate-500"}`}>
              Review customer contact details, addresses, and recent records from one dedicated workspace.
            </p>
          </div>
          <button
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${softButtonClass}`}
            onClick={fetchCustomers}
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
        </div>
      </section>

      {feedback.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedbackClassMap[feedback.type] || "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {feedback.message}
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

      <section className={`${panelThemeClass} animate-fade-up animate-delay-1`}>
        <div className="border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Customer</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Save a customer and update the list immediately.
          </p>
        </div>
        <div className="grid gap-3 px-6 py-6 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1.3fr_auto]">
          <input
            type="text"
            name="name"
            className={inputClass}
            placeholder="Customer name"
            value={form.name}
            onChange={handleFormChange}
          />
          <input
            type="text"
            name="mobile"
            className={inputClass}
            placeholder="Mobile number"
            value={form.mobile}
            onChange={handleFormChange}
          />
          <input
            type="email"
            name="email"
            className={inputClass}
            placeholder="Email address"
            value={form.email}
            onChange={handleFormChange}
          />
          <input
            type="text"
            name="address"
            className={inputClass}
            placeholder="Address"
            value={form.address}
            onChange={handleFormChange}
          />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
            onClick={handleAddCustomer}
            disabled={saving}
          >
            <FaPlus className="mr-2" />
            {saving ? "Saving..." : "Add Customer"}
          </button>
        </div>
      </section>

      <section className={`${panelThemeClass} animate-fade-up animate-delay-2`}>
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Customer List</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Showing customer IDs, contact information, and address details in one place.
            </p>
          </div>
          <div
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 md:max-w-md ${searchShellClass}`}
          >
            <FaSearch className="text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search by name, mobile, email, address"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className={isNight ? "bg-white/[0.03]" : "bg-slate-50/90"}>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id} className={`transition ${tableRowHover}`}>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{customer.customer_id}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{customer.name || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border-color)]">
                        <FaPhoneAlt className="text-[11px] text-[var(--text-muted)]" />
                        {customer.mobile || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{customer.email || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{customer.address || "-"}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {customer.created_at ? new Date(customer.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No customers found.
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

export default Customers;
