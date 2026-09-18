import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import "../../../style/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin, loading, error } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleLogin(form);
      navigate("/dashboard", { replace: true });
    } catch {
      // error is already surfaced via the `error` value from useAuth
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-ring">
            <div className="auth-brand-dot" />
          </div>
        </div>
        <div className="auth-title">SatQuery AI</div>
        <div className="auth-subtitle">Mission Control &middot; sign in to continue</div>

        {error && <div className="auth-banner-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@organisation.gov.in"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
