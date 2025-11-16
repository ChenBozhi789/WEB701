import React, { useState } from "react";
import { api } from "../api";
import "./Auth.css";

function Login({ onLoggedIn, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      setMsg("Logged in successfully ✓");
      setTimeout(() => {
        onLoggedIn();
      }, 500);
    } catch (e) {
      setMsg(e.body?.message || `Login failed (${e.status})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">Hearts and Generations</h1>
        <p className="auth-welcome">Welcome back</p>
        <p className="auth-subtitle">Sign in to continue connecting generations</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleLogin} className="auth-form">
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
            />
          </div>

          {msg && (
            <div className={`auth-message ${msg.includes("✓") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="auth-switch">
            <span>Don't have an account? </span>
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToRegister}
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

