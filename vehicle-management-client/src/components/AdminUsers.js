import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaSyncAlt,
  FaUsersCog,
  FaUserCheck,
  FaUserSlash,
  FaKey,
  FaSave,
} from "react-icons/fa";
import "./ServiceList.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [query, setQuery] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_name: "staff",
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get("http://localhost:5000/admin/users", { headers: authHeaders }),
        axios.get("http://localhost:5000/admin/roles", { headers: authHeaders }),
      ]);

      const usersList = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(usersList);
      setRoleDrafts(
        usersList.reduce((acc, user) => {
          acc[user.user_id] = user.role;
          return acc;
        }, {})
      );
      const roleList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
      setRoles(roleList);

      if (roleList.length > 0) {
        setForm((prev) =>
          roleList.find((r) => r.role_name === prev.role_name)
            ? prev
            : { ...prev, role_name: roleList[0].role_name }
        );
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "danger", message: err.response?.data?.error || "Failed to load admin data." });
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    setFeedback({ type: "", message: "" });

    if (!form.name || !form.username || !form.password || !form.role_name) {
      setFeedback({ type: "warning", message: "Name, username, password and role are required." });
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/admin/users",
        {
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim() || null,
          password: form.password,
          role_name: form.role_name,
        },
        { headers: authHeaders }
      );

      setFeedback({ type: "success", message: "User created successfully." });
      setForm({ name: "", username: "", email: "", password: "", role_name: form.role_name });
      fetchData();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "danger",
        message: err.response?.data?.details || err.response?.data?.error || "Failed to create user.",
      });
    }
  };

  const handleStatusToggle = async (user) => {
    setFeedback({ type: "", message: "" });

    try {
      await axios.put(
        `http://localhost:5000/admin/users/${user.user_id}/status`,
        { is_active: !Boolean(user.is_active) },
        { headers: authHeaders }
      );

      setFeedback({ type: "success", message: "User status updated." });
      fetchData();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "danger", message: err.response?.data?.error || "Failed to update status." });
    }
  };

  const handleRoleChange = (userId, roleName) => {
    setRoleDrafts((prev) => ({ ...prev, [userId]: roleName }));
  };

  const handleRoleUpdate = async (user) => {
    setFeedback({ type: "", message: "" });
    const targetRole = roleDrafts[user.user_id];
    if (!targetRole || targetRole === user.role) return;

    try {
      await axios.put(
        `http://localhost:5000/admin/users/${user.user_id}/role`,
        { role_name: targetRole },
        { headers: authHeaders }
      );
      setFeedback({ type: "success", message: "User role updated." });
      fetchData();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "danger",
        message: err.response?.data?.error || "Failed to update user role.",
      });
    }
  };

  const handleOpenPasswordReset = (user) => {
    setResetTargetUser(user);
    setResetPasswordForm({ password: "", confirmPassword: "" });
    setShowResetModal(true);
  };

  const handleClosePasswordReset = () => {
    setShowResetModal(false);
    setResetTargetUser(null);
    setResetPasswordForm({ password: "", confirmPassword: "" });
  };

  const handlePasswordResetSubmit = async () => {
    setFeedback({ type: "", message: "" });
    if (!resetTargetUser) return;

    if (resetPasswordForm.password.length < 6) {
      setFeedback({ type: "warning", message: "Password must be at least 6 characters." });
      return;
    }
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setFeedback({ type: "warning", message: "Password confirmation does not match." });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/admin/users/${resetTargetUser.user_id}/password`,
        { password: resetPasswordForm.password },
        { headers: authHeaders }
      );
      setFeedback({ type: "success", message: "User password reset successfully." });
      handleClosePasswordReset();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "danger",
        message: err.response?.data?.error || "Failed to reset password.",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const username = String(u.username || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const role = String(u.role || "").toLowerCase();
      return (
        name.includes(normalized) ||
        username.includes(normalized) ||
        email.includes(normalized) ||
        role.includes(normalized)
      );
    });
  }, [query, users]);

  const currentRole = localStorage.getItem("auth_role") || "";
  const canCreateUsers = currentRole === "super_admin";
  let currentUserId = null;
  try {
    currentUserId = JSON.parse(localStorage.getItem("auth_user") || "{}").user_id || null;
  } catch (error) {
    currentUserId = null;
  }

  return (
    <div className="container py-4 entity-page admin-users-page">
      <div className="card border-0 shadow-sm mb-4 entity-hero">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h2 className="mb-1">Admin Users</h2>
            <p className="text-muted mb-0">Manage platform users, roles, and account status.</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={fetchData}>
            <FaSyncAlt className="me-2" /> Refresh
          </button>
        </div>
      </div>

      {feedback.message && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card stat-card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">Total Users</small>
                <h3 className="mb-0">{users.length}</h3>
              </div>
              <span className="stat-chip bg-dark-subtle text-dark">
                <FaUsersCog />
              </span>
            </div>
          </div>
        </div>
      </div>

      {canCreateUsers && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0 pt-3">
            <h5 className="mb-0">Create User</h5>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-3">
                <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
              </div>
              <div className="col-md-2">
                <input className="form-control" name="username" value={form.username} onChange={handleChange} placeholder="Username" />
              </div>
              <div className="col-md-2">
                <input className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Email (optional)" />
              </div>
              <div className="col-md-2">
                <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} placeholder="Password" />
              </div>
              <div className="col-md-2">
                <select className="form-select" name="role_name" value={form.role_name} onChange={handleChange}>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_name}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1 d-grid">
                <button className="btn btn-success" onClick={handleCreate}>
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
          <h5 className="mb-0">User List</h5>
          <input
            className="form-control"
            style={{ maxWidth: 320 }}
            placeholder="Search by name, username, email, role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th className="role-col">Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">Loading users...</td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.email || "-"}</td>
                    <td className="role-col">
                      {canCreateUsers ? (
                        <div className="d-flex gap-2 align-items-center">
                          <select
                            className="form-select form-select-sm"
                            value={roleDrafts[u.user_id] || u.role}
                            onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                            disabled={u.user_id === currentUserId}
                          >
                            {roles.map((r) => (
                              <option key={r.role_id} value={r.role_name}>
                                {r.role_name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleRoleUpdate(u)}
                            disabled={
                              !roleDrafts[u.user_id] ||
                              roleDrafts[u.user_id] === u.role ||
                              u.user_id === currentUserId
                            }
                          >
                            <FaSave />
                          </button>
                        </div>
                      ) : (
                        <span className="badge text-bg-light border">{u.role}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? "bg-success" : "bg-secondary"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {canCreateUsers ? (
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className={`btn btn-sm ${u.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => handleStatusToggle(u)}
                            disabled={u.user_id === currentUserId}
                          >
                            {u.is_active ? (
                              <>
                                <FaUserSlash className="me-1" /> Deactivate
                              </>
                            ) : (
                              <>
                                <FaUserCheck className="me-1" /> Activate
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleOpenPasswordReset(u)}
                          >
                            <FaKey className="me-1" /> Reset Password
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">No permission</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showResetModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>Reset Password</h5>
              <button className="btn-close" onClick={handleClosePasswordReset} />
            </div>
            <div className="custom-modal-body">
              <p className="text-muted mb-3">
                Reset password for <strong>{resetTargetUser?.username}</strong>
              </p>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={resetPasswordForm.password}
                  onChange={(e) =>
                    setResetPasswordForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            <div className="custom-modal-footer">
              <button className="btn btn-secondary me-2" onClick={handleClosePasswordReset}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handlePasswordResetSubmit}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
