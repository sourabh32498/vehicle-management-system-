import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaSearch, FaSyncAlt, FaClipboardList } from "react-icons/fa";
import "./ServiceList.css";

function JobCards() {
  const [jobCards, setJobCards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    vehicle_id: "",
    service_date: "",
    status: "Pending",
    estimated_cost: "",
    actual_cost: "",
    remarks: "",
  });

  const fetchJobCards = useCallback(
    () =>
      axios
        .get("http://localhost:5000/job-cards")
        .then((res) => setJobCards(Array.isArray(res.data) ? res.data : []))
        .catch((err) => {
          console.error(err);
          setFeedback({ type: "danger", message: "Failed to load job cards." });
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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchJobCards(), fetchVehicles()]);
    } finally {
      setLoading(false);
    }
  }, [fetchJobCards, fetchVehicles]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredJobCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return jobCards.filter((j) => {
      const vehicle = `${j.vehicle_model || ""} ${j.vehicle_owner || ""}`.toLowerCase();
      const status = String(j.status || "").toLowerCase();
      const remarks = String(j.remarks || "").toLowerCase();

      const searchMatch =
        !normalized || vehicle.includes(normalized) || status.includes(normalized) || remarks.includes(normalized);

      const statusMatch =
        statusFilter === "All" || String(j.status || "").toLowerCase() === statusFilter.toLowerCase();

      return searchMatch && statusMatch;
    });
  }, [jobCards, query, statusFilter]);

  const metrics = useMemo(() => {
    const pending = jobCards.filter((j) => String(j.status || "").toLowerCase() === "pending").length;
    const inProgress = jobCards.filter(
      (j) => String(j.status || "").toLowerCase() === "in progress"
    ).length;
    const completed = jobCards.filter((j) => {
      const value = String(j.status || "").toLowerCase();
      return value === "completed" || value === "delivered";
    }).length;

    return { pending, inProgress, completed };
  }, [jobCards]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({
      vehicle_id: "",
      service_date: "",
      status: "Pending",
      estimated_cost: "",
      actual_cost: "",
      remarks: "",
    });
    setEditingCard(null);
    setError("");
  };

  const handleOpenModal = (card = null) => {
    setError("");

    if (card) {
      setEditingCard(card);
      setForm({
        vehicle_id: card.vehicle_id || "",
        service_date: card.service_date ? String(card.service_date).slice(0, 10) : "",
        status: card.status || "Pending",
        estimated_cost: card.estimated_cost ?? "",
        actual_cost: card.actual_cost ?? "",
        remarks: card.remarks || "",
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = () => {
    setError("");
    setFeedback({ type: "", message: "" });

    if (!form.vehicle_id) return setError("Please select a vehicle.");
    if (!form.service_date) return setError("Service date is required.");
    if (!form.status) return setError("Status is required.");
    if (form.estimated_cost !== "" && Number.isNaN(parseFloat(form.estimated_cost))) {
      return setError("Estimated cost must be a valid number.");
    }
    if (form.actual_cost !== "" && Number.isNaN(parseFloat(form.actual_cost))) {
      return setError("Actual cost must be a valid number.");
    }

    const payload = {
      vehicle_id: Number(form.vehicle_id),
      service_date: form.service_date,
      status: form.status,
      estimated_cost: form.estimated_cost === "" ? null : parseFloat(form.estimated_cost),
      actual_cost: form.actual_cost === "" ? null : parseFloat(form.actual_cost),
      remarks: form.remarks.trim() || null,
    };

    const request = editingCard
      ? axios.put(`http://localhost:5000/job-cards/${editingCard.job_id}`, payload)
      : axios.post("http://localhost:5000/job-cards", payload);

    request
      .then(() => {
        fetchJobCards();
        handleCloseModal();
        setFeedback({
          type: "success",
          message: editingCard ? "Job card updated successfully." : "Job card added successfully.",
        });
      })
      .catch((err) => {
        console.error(err);
        const apiError = err.response?.data;
        if (typeof apiError === "string") {
          setError(apiError);
          return;
        }
        setError(apiError?.details || apiError?.error || err.message || "Failed to save job card.");
      });
  };

  const handleDelete = (id) => {
    setFeedback({ type: "", message: "" });
    if (!window.confirm("Delete this job card?")) return;

    axios
      .delete(`http://localhost:5000/job-cards/${id}`)
      .then(() => {
        fetchJobCards();
        setFeedback({ type: "success", message: "Job card deleted successfully." });
      })
      .catch((err) => {
        console.error(err);
        setFeedback({ type: "danger", message: err.response?.data?.error || "Failed to delete job card." });
      });
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "-";
    return `Rs ${amount.toFixed(2)}`;
  };

  return (
    <div className="container py-4 entity-page jobcards-page">
      <div className="card border-0 shadow-sm mb-4 entity-hero">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h2 className="mb-1">Job Card Management</h2>
            <p className="text-muted mb-0">Create and track workshop job cards efficiently.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" /> Add Job Card
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
                <small className="text-muted">Total Job Cards</small>
                <h3 className="mb-0">{jobCards.length}</h3>
              </div>
              <span className="stat-chip bg-dark-subtle text-dark">
                <FaClipboardList />
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
              <small className="text-muted d-block">Completed</small>
              <h3 className="mb-0">{metrics.completed}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-column flex-lg-row gap-2 justify-content-between align-items-lg-center">
          <h5 className="mb-0">Job Card List</h5>
          <div className="d-flex gap-2 flex-wrap">
            <div className="search-box input-group">
              <span className="input-group-text bg-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by vehicle, status, remarks"
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
                <th>Job ID</th>
                <th>Vehicle</th>
                <th>Service Date</th>
                <th>Status</th>
                <th>Estimated Cost</th>
                <th>Actual Cost</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading job cards...</td>
                </tr>
              ) : filteredJobCards.length > 0 ? (
                filteredJobCards.map((card) => (
                  <tr key={card.job_id}>
                    <td>{card.job_id}</td>
                    <td>
                      {card.vehicle_model && card.vehicle_owner
                        ? `${card.vehicle_model} (${card.vehicle_owner})`
                        : card.vehicle_id}
                    </td>
                    <td>{card.service_date ? String(card.service_date).slice(0, 10) : ""}</td>
                    <td>
                      <span
                        className={`badge ${
                          card.status === "Pending"
                            ? "bg-warning text-dark"
                            : card.status === "In Progress"
                            ? "bg-dark"
                            : "bg-success"
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td>{formatCurrency(card.estimated_cost)}</td>
                    <td>{formatCurrency(card.actual_cost)}</td>
                    <td>{card.remarks || "-"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal(card)}>
                          <FaEdit />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(card.job_id)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No job cards found.</td>
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
              <h5>{editingCard ? "Edit Job Card" : "Add Job Card"}</h5>
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
                <label>Service Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="service_date"
                  value={form.service_date}
                  onChange={handleChange}
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

              <div className="mb-3">
                <label>Estimated Cost</label>
                <input
                  type="number"
                  className="form-control"
                  name="estimated_cost"
                  value={form.estimated_cost}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label>Actual Cost</label>
                <input
                  type="number"
                  className="form-control"
                  name="actual_cost"
                  value={form.actual_cost}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label>Remarks</label>
                <textarea
                  className="form-control"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="custom-modal-footer">
              <button className="btn btn-secondary me-2" onClick={handleCloseModal}>
                Close
              </button>
              <button className="btn btn-success" onClick={handleSubmit}>
                {editingCard ? "Update Job Card" : "Add Job Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobCards;
