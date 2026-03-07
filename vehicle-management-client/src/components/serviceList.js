import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaSearch, FaSyncAlt, FaWrench } from "react-icons/fa";
import "./ServiceList.css";

function ServiceList() {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceMaster, setServiceMaster] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    vehicle_id: "",
    service_type: "",
    service_date: "",
    cost: "",
    status: "Pending",
  });
  const [error, setError] = useState("");

  const fetchServices = useCallback(
    () =>
      axios
        .get("http://localhost:5000/services")
        .then((res) => setServices(Array.isArray(res.data) ? res.data : []))
        .catch((err) => {
          console.error(err);
          setFeedback({ type: "danger", message: "Failed to load services." });
        }),
    []
  );

  const fetchVehicles = useCallback(
    () =>
      axios
        .get("http://localhost:5000/vehicles")
        .then((res) => setVehicles(Array.isArray(res.data) ? res.data : []))
        .catch((err) => console.error(err)),
    []
  );

  const fetchServiceMaster = useCallback(
    () =>
      axios
        .get("http://localhost:5000/service-master")
        .then((res) => setServiceMaster(Array.isArray(res.data) ? res.data : []))
        .catch((err) => {
          console.error(err);
          setServiceMaster([]);
        }),
    []
  );

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchServices(), fetchVehicles(), fetchServiceMaster()]);
    } finally {
      setLoading(false);
    }
  }, [fetchServiceMaster, fetchServices, fetchVehicles]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return services.filter((s) => {
      const vehicleLabel = `${s.vehicle_model || ""} ${s.vehicle_owner || ""}`.toLowerCase();
      const serviceType = String(s.service_type || "").toLowerCase();
      const status = String(s.status || "").toLowerCase();

      const matchesSearch =
        !normalized ||
        vehicleLabel.includes(normalized) ||
        serviceType.includes(normalized) ||
        status.includes(normalized);

      const matchesStatus =
        statusFilter === "All" || String(s.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [query, services, statusFilter]);

  const metrics = useMemo(() => {
    const pending = services.filter((s) => String(s.status || "").toLowerCase() === "pending").length;
    const inProgress = services.filter(
      (s) => String(s.status || "").toLowerCase() === "in progress"
    ).length;
    const completed = services.filter((s) => {
      const value = String(s.status || "").toLowerCase();
      return value === "completed" || value === "delivered";
    }).length;

    const revenue = services.reduce((sum, s) => {
      const value = parseFloat(s.cost);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return { pending, inProgress, completed, revenue };
  }, [services]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "service_type") {
      const selectedService = serviceMaster.find((item) => item.service_type === value);
      setForm((prev) => ({
        ...prev,
        service_type: value,
        cost: selectedService ? String(selectedService.base_cost) : prev.cost,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShowModal = (service = null) => {
    setError("");

    if (service) {
      setEditingService(service);
      setForm({
        vehicle_id: service.vehicle_id || "",
        service_type: service.service_type || "",
        service_date: service.service_date ? String(service.service_date).slice(0, 10) : "",
        cost: service.cost ?? "",
        status: service.status || "Pending",
      });
    } else {
      setEditingService(null);
      setForm({
        vehicle_id: "",
        service_type: "",
        service_date: "",
        cost: "",
        status: "Pending",
      });
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError("");
  };

  const handleSubmit = () => {
    setError("");
    setFeedback({ type: "", message: "" });

    if (!form.vehicle_id) return setError("Please select a vehicle.");
    if (!form.service_type.trim()) return setError("Service Type is required.");
    if (!form.service_date) return setError("Service Date is required.");
    if (!form.cost || parseFloat(form.cost) <= 0) return setError("Cost must be greater than 0.");
    if (!form.status) return setError("Status is required.");

    const payload = {
      vehicle_id: Number(form.vehicle_id),
      service_type: form.service_type.trim(),
      service_date: form.service_date,
      cost: parseFloat(form.cost),
      status: form.status,
    };

    const request = editingService
      ? axios.put(`http://localhost:5000/services/${editingService.service_id}`, payload)
      : axios.post("http://localhost:5000/services", payload);

    request
      .then(() => {
        fetchServices();
        handleCloseModal();
        setFeedback({
          type: "success",
          message: editingService ? "Service updated successfully." : "Service added successfully.",
        });
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to save service.");
        console.error(err);
      });
  };

  const handleDelete = (id) => {
    setFeedback({ type: "", message: "" });

    if (!window.confirm("Delete this service?")) return;

    axios
      .delete(`http://localhost:5000/services/${id}`)
      .then(() => {
        fetchServices();
        setFeedback({ type: "success", message: "Service deleted successfully." });
      })
      .catch((err) => {
        console.error(err);
        setFeedback({ type: "danger", message: "Failed to delete service." });
      });
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Rs 0.00";
    return `Rs ${amount.toFixed(2)}`;
  };

  return (
    <div className="container py-4 entity-page services-page">
      <div className="card border-0 shadow-sm mb-4 entity-hero">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h2 className="mb-1">Service Management</h2>
            <p className="text-muted mb-0">Track services, statuses, and revenue in one place.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" /> Add Service
            </button>
            <button className="btn btn-outline-secondary" onClick={fetchInitialData}>
              <FaSyncAlt className="me-2" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {feedback.message && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">Total Services</small>
                <h3 className="mb-0">{services.length}</h3>
              </div>
              <span className="stat-chip bg-success-subtle text-success">
                <FaWrench />
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted d-block">Pending</small>
              <h3 className="mb-0">{metrics.pending}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted d-block">In Progress</small>
              <h3 className="mb-0">{metrics.inProgress}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted d-block">Revenue</small>
              <h3 className="mb-0">{formatCurrency(metrics.revenue)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-column flex-lg-row gap-2 justify-content-between align-items-lg-center">
          <h5 className="mb-0">Service List</h5>
          <div className="d-flex gap-2 flex-wrap">
            <div className="search-box input-group">
              <span className="input-group-text bg-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by vehicle, type, status"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Service ID</th>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Service Date</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading services...</td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <tr key={service.service_id}>
                    <td>{service.service_id}</td>
                    <td>
                      {service.vehicle_model && service.vehicle_owner
                        ? `${service.vehicle_model} (${service.vehicle_owner})`
                        : service.vehicle_id}
                    </td>
                    <td>{service.service_type}</td>
                    <td>{service.service_date ? String(service.service_date).slice(0, 10) : ""}</td>
                    <td>{formatCurrency(service.cost)}</td>
                    <td>
                      <span
                        className={`badge ${
                          service.status === "Pending"
                            ? "bg-warning text-dark"
                            : service.status === "In Progress"
                            ? "bg-dark"
                            : "bg-success"
                        }`}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleShowModal(service)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(service.service_id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No services found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>{editingService ? "Edit Service" : "Add Service"}</h5>
              <button className="btn-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <div className="custom-modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label>Vehicle</label>
                <select
                  className="form-select"
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.ID} value={v.ID}>
                      {v.Model} ({v.Owner})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label>Service Type</label>
                <select
                  className="form-select"
                  name="service_type"
                  value={form.service_type}
                  onChange={handleChange}
                >
                  <option value="">Select Service Type</option>
                  {serviceMaster.map((item) => (
                    <option key={item.service_id} value={item.service_type}>
                      {item.service_type}
                    </option>
                  ))}
                </select>
                {serviceMaster.length === 0 && (
                  <small className="text-danger">No active service master data found.</small>
                )}
              </div>

              <div className="mb-3">
                <label>Service Date</label>
                <input
                  type="date"
                  name="service_date"
                  className="form-control"
                  value={form.service_date}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label>Cost (Rs)</label>
                <input
                  type="number"
                  name="cost"
                  className="form-control"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="Enter cost"
                />
              </div>

              <div className="mb-3">
                <label>Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="custom-modal-footer">
              <button className="btn btn-secondary me-2" onClick={handleCloseModal}>
                Close
              </button>
              <button className="btn btn-success" onClick={handleSubmit}>
                {editingService ? "Update Service" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceList;
