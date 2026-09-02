import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signin, adminLogin } from '../api/auth';
import '../styles/Signup.css';

/**
 * Signin
 * SRS 3.1.2 (client) and 3.2.1 (admin login).
 * A single screen with a role toggle: Client hits POST /signin,
 * Admin hits POST /admin/login against the pre-seeded admin record.
 *
 * Props:
 *  - onAuthenticated: fn({ role, name })  -> lifts session up to App
 */
function Signin({ onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.justRegistered;

  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.identifier.trim()) {
      next.identifier = role === 'admin' ? 'Username is required' : 'Email is required';
    }
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result =
        role === 'admin' ? await adminLogin(form.identifier, form.password) : await signin(form.identifier, form.password);

      onAuthenticated({ role, name: result.name });
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      // SRS 3.1.2: "Invalid email or password" on failure
      setBannerError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card card">
        <div className="auth-brand">
          <span className="auth-brand-mark">SB</span>
          <span>Subscription Billing</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Access your billing dashboard.</p>

        <div className="auth-role-toggle" role="tablist" aria-label="Sign in as">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'client'}
            className={role === 'client' ? 'active' : ''}
            onClick={() => {
              setRole('client');
              setErrors({});
              setBannerError('');
            }}
          >
            Client
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'admin'}
            className={role === 'admin' ? 'active' : ''}
            onClick={() => {
              setRole('admin');
              setErrors({});
              setBannerError('');
            }}
          >
            Admin
          </button>
        </div>

        {justRegistered && (
          <div className="form-banner form-banner-success">Account created. Sign in to continue.</div>
        )}
        {bannerError && <div className="form-banner form-banner-error">{bannerError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="identifier">{role === 'admin' ? 'Username' : 'Email'}</label>
            <input
              id="identifier"
              name="identifier"
              type={role === 'admin' ? 'text' : 'email'}
              placeholder={role === 'admin' ? 'admin' : 'jordan@company.com'}
              value={form.identifier}
              onChange={handleChange}
              className={errors.identifier ? 'has-error' : ''}
            />
            {errors.identifier && <p className="field-error">{errors.identifier}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'has-error' : ''}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {role === 'client' && (
          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        )}

        <p className="auth-demo-hint">
          Demo credentials — Client: any email + password 8+ chars · Admin: admin / admin123
        </p>
      </div>
    </div>
  );
}

export default Signin;
