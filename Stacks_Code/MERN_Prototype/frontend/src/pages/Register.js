import React, { useState } from "react";
import { api } from "../api";
import "./Auth.css";

function Register({ onRegistered, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("beneficiary");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    try {
      await api.register({ name, email, password, role });
      setMsg("Registered successfully ✓ — now login");
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (e) {
      setMsg(e.body?.message || `Register failed (${e.status})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">Hearts and Generations</h1>
        <p className="auth-welcome">Create your account</p>
        <p className="auth-subtitle">Join us to start connecting generations</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-select"
              required
            >
              <option value="beneficiary">Beneficiary</option>
              <option value="member">Member</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {msg && (
            <div className={`auth-message ${msg.includes("✓") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="auth-switch">
            <span>Already have an account? </span>
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

