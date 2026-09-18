import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import "../../../style/auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { handleRegister, loading, error } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organisation: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Enter a valid email address";
    }
    // Mirrors the backend's password policy so the user sees the problem
    // before submitting, not just after a failed request.
    if (
      form.password.length < 8 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)
    ) {
      errors.password =
        "At least 8 characters, with an uppercase letter, a lowercase letter, and a number";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await handleRegister(form);
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
        <div className="auth-title">Create your account</div>
        <div className="auth-subtitle">SatQuery AI &middot; Mission Control</div>

        {error && <div className="auth-banner-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="name">FULL NAME</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Aditi Sharma"
              value={form.name}
              onChange={handleChange}
              className={fieldErrors.name ? "has-error" : ""}
              autoComplete="name"
            />
            {fieldErrors.name && <div className="auth-field-error">{fieldErrors.name}</div>}
          </div>

          <div className="auth-field">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@organisation.gov.in"
              value={form.email}
              onChange={handleChange}
              className={fieldErrors.email ? "has-error" : ""}
              autoComplete="email"
            />
            {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
          </div>

          <div className="auth-field">
            <label htmlFor="organisation">ORGANISATION (OPTIONAL)</label>
            <input
              id="organisation"
              name="organisation"
              type="text"
              placeholder="NDMA, District Admin, etc."
              value={form.organisation}
              onChange={handleChange}
              autoComplete="organization"
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
              className={fieldErrors.password ? "has-error" : ""}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <div className="auth-field-error">{fieldErrors.password}</div>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
