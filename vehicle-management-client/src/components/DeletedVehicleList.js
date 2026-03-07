import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRecycle, FaSearch, FaSyncAlt, FaUndoAlt, FaCar } from "react-icons/fa";
import { getDeletedVehicles, restoreVehicle } from "../services/api";
import "./DeletedVehicleList.css";

function DeletedVehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const navigate = useNavigate();

  const normalizeVehicle = useCallback(
    (vehicle) => ({
      id: vehicle.ID ?? vehicle.vehicle_id,
      model: vehicle.Model ?? vehicle.model,
      owner: vehicle.Owner ?? vehicle.owner,
      registration: vehicle.Registration ?? vehicle.registration,
    }),
    []
  );

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeletedVehicles();
      const list = Array.isArray(res.data) ? res.data.map(normalizeVehicle) : [];
      setVehicles(list);
    } catch (err) {
      console.error("Failed to fetch deleted vehicles:", err.response?.data || err.message);
      setFeedback({ type: "danger", message: "Could not load deleted vehicles." });
    } finally {
      setLoading(false);
    }
  }, [normalizeVehicle]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vehicles;

    return vehicles.filter((v) => {
      const model = String(v.model || "").toLowerCase();
      const owner = String(v.owner || "").toLowerCase();
      const registration = String(v.registration || "").toLowerCase();
      return (
        model.includes(normalized) ||
        owner.includes(normalized) ||
        registration.includes(normalized)
      );
    });
  }, [query, vehicles]);

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this vehicle?")) return;

    setFeedback({ type: "", message: "" });
    setRestoringId(id);

    try {
      await restoreVehicle(id);
      setFeedback({ type: "success", message: "Vehicle restored successfully." });
      navigate("/vehicles", { state: { refreshTs: Date.now(), restoredId: id } });
    } catch (err) {
      console.error("Restore failed:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.message;
      setFeedback({ type: "danger", message: `Restore failed: ${errorMessage}` });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="container py-4 deleted-page">
      <div className="card border-0 shadow-sm mb-4 deleted-hero">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h2 className="mb-1">Deleted Vehicles</h2>
            <p className="text-muted mb-0">Recycle bin for soft-deleted records. Restore when required.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/vehicles" className="btn btn-outline-secondary">
              <FaCar className="me-2" /> Back to Vehicles
            </Link>
            <button className="btn btn-primary" onClick={fetchDeleted}>
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
                <small className="text-muted">Deleted Vehicles</small>
                <h3 className="mb-0">{vehicles.length}</h3>
              </div>
              <span className="stat-chip bg-warning-subtle text-warning">
                <FaRecycle />
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">Search Result</small>
                <h3 className="mb-0">{filteredVehicles.length}</h3>
              </div>
              <span className="stat-chip bg-success-subtle text-success">
                <FaSearch />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
          <h5 className="mb-0">Recycle Bin List</h5>
          <div className="search-box input-group">
            <span className="input-group-text bg-white">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by model, owner, registration"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Model</th>
                <th>Owner</th>
                <th>Registration</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading deleted vehicles...
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.model}</td>
                    <td>{v.owner}</td>
                    <td>
                      <span className="badge text-bg-light border">{v.registration}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm"
                        disabled={restoringId === v.id}
                        onClick={() => handleRestore(v.id)}
                      >
                        <FaUndoAlt className="me-2" />
                        {restoringId === v.id ? "Restoring..." : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No deleted vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DeletedVehicleList;
