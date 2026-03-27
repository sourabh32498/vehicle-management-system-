import React, { useEffect, useMemo, useState } from "react";
import { FaBatteryHalf, FaCar, FaChartLine, FaClipboardList, FaCogs, FaWrench } from "react-icons/fa";
import { getBatteries, getJobCards, getServices, getSpareParts, getVehicles } from "../services/api";
import "./Reports.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [batteries, setBatteries] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      const [vehiclesResult, servicesResult, jobCardsResult, sparePartsResult, batteriesResult] =
        await Promise.allSettled([
          getVehicles(),
          getServices(),
          getJobCards(),
          getSpareParts(),
          getBatteries(),
        ]);

      if (!isMounted) return;

      const hasFailure = [
        vehiclesResult,
        servicesResult,
        jobCardsResult,
        sparePartsResult,
        batteriesResult,
      ].some((result) => result.status === "rejected");

      if (hasFailure) {
        setError("Some report data could not be loaded. Showing available results.");
      }

      setVehicles(
        vehiclesResult.status === "fulfilled" && Array.isArray(vehiclesResult.value?.data)
          ? vehiclesResult.value.data
          : []
      );
      setServices(
        servicesResult.status === "fulfilled" && Array.isArray(servicesResult.value?.data)
          ? servicesResult.value.data
          : []
      );
      setJobCards(
        jobCardsResult.status === "fulfilled" && Array.isArray(jobCardsResult.value?.data)
          ? jobCardsResult.value.data
          : []
      );
      setSpareParts(
        sparePartsResult.status === "fulfilled" && Array.isArray(sparePartsResult.value?.data)
          ? sparePartsResult.value.data
          : []
      );
      setBatteries(
        batteriesResult.status === "fulfilled" && Array.isArray(batteriesResult.value?.data)
          ? batteriesResult.value.data
          : []
      );
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const reportStats = useMemo(() => {
    const completedServices = services.filter((service) => {
      const status = String(service.status || "").toLowerCase();
      return status === "completed" || status === "delivered";
    }).length;

    const pendingServices = services.filter((service) => {
      const status = String(service.status || "").toLowerCase();
      return status === "pending" || status === "in progress";
    }).length;

    const totalRevenue = services.reduce((sum, service) => {
      const value = Number.parseFloat(service.cost);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const lowSpareParts = spareParts.filter((part) => Number(part.quantity) <= 5).length;
    const lowBatteries = batteries.filter((battery) => Number(battery.quantity) <= 3).length;

    return {
      completedServices,
      pendingServices,
      totalRevenue,
      lowInventory: lowSpareParts + lowBatteries,
    };
  }, [batteries, services, spareParts]);

  const recentServices = useMemo(() => {
    return [...services]
      .sort((a, b) => new Date(b.service_date || 0) - new Date(a.service_date || 0))
      .slice(0, 5);
  }, [services]);

  const recentJobCards = useMemo(() => {
    return [...jobCards]
      .sort((a, b) => new Date(b.created_at || b.job_card_date || 0) - new Date(a.created_at || a.job_card_date || 0))
      .slice(0, 5);
  }, [jobCards]);

  return (
    <div className="container py-4 entity-page reports-page">
      <div className="card entity-hero border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <div className="reports-eyebrow mb-2">
                <FaChartLine className="me-2" />
                Reports Center
              </div>
              <h2 className="mb-2">Workshop reports and summary insights</h2>
              <p className="mb-0">
                This page is separate from Service Operations and gives you a quick reporting view across
                vehicles, jobs, services, and inventory.
              </p>
            </div>
            <div className="reports-revenue-card">
              <small className="d-block text-uppercase">Revenue tracked</small>
              <strong>{formatCurrency(reportStats.totalRevenue)}</strong>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-warning rounded-4 border-0 mb-4">{error}</div>}

      <div className="row g-3 mb-4">
        {[
          { label: "Vehicles", value: vehicles.length, icon: FaCar, tone: "primary" },
          { label: "Completed Services", value: reportStats.completedServices, icon: FaWrench, tone: "success" },
          { label: "Open Job Cards", value: jobCards.length, icon: FaClipboardList, tone: "warning" },
          { label: "Low Inventory Items", value: reportStats.lowInventory, icon: FaBatteryHalf, tone: "danger" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div className="col-12 col-sm-6 col-xl-3" key={item.label}>
              <div className={`card stat-card reports-stat-card reports-stat-${item.tone}`}>
                <div className="card-body d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted d-block mb-2">{item.label}</small>
                    <h3 className="mb-0">{loading ? "--" : item.value}</h3>
                  </div>
                  <div className="stat-chip reports-chip">
                    <Icon />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="mb-1">Recent service activity</h4>
                  <p className="text-muted mb-0">Latest service records from the workshop.</p>
                </div>
                <span className="badge text-bg-light rounded-pill px-3 py-2">
                  Pending: {loading ? "--" : reportStats.pendingServices}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0 reports-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && recentServices.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No service records available.
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          Loading report data...
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      recentServices.map((service) => (
                        <tr key={service.service_id}>
                          <td>{service.vehicle_model || service.vehicle_number || "Vehicle"}</td>
                          <td>{service.service_type || "General Service"}</td>
                          <td>{service.service_date ? new Date(service.service_date).toLocaleDateString("en-IN") : "-"}</td>
                          <td>
                            <span className="reports-status">{service.status || "Pending"}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCogs />
                <h4 className="mb-0">Operational snapshot</h4>
              </div>

              <div className="reports-summary-list">
                <div className="reports-summary-item">
                  <span>Total services logged</span>
                  <strong>{loading ? "--" : services.length}</strong>
                </div>
                <div className="reports-summary-item">
                  <span>Total job cards</span>
                  <strong>{loading ? "--" : jobCards.length}</strong>
                </div>
                <div className="reports-summary-item">
                  <span>Spare parts tracked</span>
                  <strong>{loading ? "--" : spareParts.length}</strong>
                </div>
                <div className="reports-summary-item">
                  <span>Batteries tracked</span>
                  <strong>{loading ? "--" : batteries.length}</strong>
                </div>
              </div>

              <hr />

              <h5 className="mb-3">Recent job cards</h5>
              <div className="reports-jobs">
                {!loading && recentJobCards.length === 0 && (
                  <div className="text-muted">No job cards available.</div>
                )}
                {loading && <div className="text-muted">Loading recent job cards...</div>}
                {!loading &&
                  recentJobCards.map((job) => (
                    <div className="reports-job-row" key={job.job_card_id}>
                      <div>
                        <strong>{job.customer_name || job.vehicle_number || "Job Card"}</strong>
                        <div className="text-muted small">
                          {job.vehicle_model || "Vehicle details unavailable"}
                        </div>
                      </div>
                      <span>{job.status || "Open"}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
