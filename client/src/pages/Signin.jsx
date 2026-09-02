import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signin, adminLogin } from '../api/auth';
import '../styles/Signup.css';

/**
 * Signin
 * Strict validation and Supabase authentication
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
    setBannerError('');
  };

  const validate = () => {
    const next = {};
    if (!form.identifier.trim()) {
      next.identifier = role === 'admin' ? 'Username is required' : 'Email is required';
    } else if (role === 'client' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identifier.trim())) {
      next.identifier = 'Please enter a valid email address (e.g. name@domain.com)';
    }

    if (!form.password) {
      next.password = 'Password is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const cleanIdentifier = form.identifier.trim();
      const result =
        role === 'admin' ? await adminLogin(cleanIdentifier, form.password) : await signin(cleanIdentifier, form.password);

      onAuthenticated({ role, name: result.name, id: result.id, email: result.email || cleanIdentifier });
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
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
        <p className="auth-subtitle">Access your billing workspace.</p>

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
          <div className="form-banner form-banner-success">Account created successfully! Please sign in with your credentials.</div>
        )}
        {bannerError && <div className="form-banner form-banner-error">{bannerError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="identifier">{role === 'admin' ? 'Admin Username' : 'Client Email'}</label>
            <input
              id="identifier"
              name="identifier"
              type={role === 'admin' ? 'text' : 'email'}
              placeholder={role === 'admin' ? 'admin' : 'name@company.com'}
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
      </div>
    </div>
  );
}

export default Signin;
