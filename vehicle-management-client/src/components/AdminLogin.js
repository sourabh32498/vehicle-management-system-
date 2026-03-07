import React, { useState } from "react";
import axios from "axios";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/login", {
        username,
        password
      });

      if (res.data.success) {
        localStorage.setItem("isAdminLoggedIn", "true"); // ✅ FIX
        alert("Login successful!");
        window.location.href = "/admin/dashboard";
      } else {
        setError("Login failed. Please check your credentials.");
      }

    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Login</h2>

      <form onSubmit={handleLogin} className="shadow p-4 rounded bg-light">
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
