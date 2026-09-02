import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import '../styles/Signup.css';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '' };

/**
 * Signup
 * SRS 3.1.1 — Name, Email, Password, (optional) phone number.
 * Validates empty fields, email format, and password length before
 * calling the auth API. On success, redirects to Sign In.
 */
function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
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
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address';
    }
    if (!form.password) {
      next.password = 'Password is required';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
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
      // POST /signup — server hashes the password before storing (bcrypt)
      await signup(form);
      navigate('/signin', { state: { justRegistered: true } });
    } catch (err) {
      setBannerError(err.message || 'Something went wrong. Please try again.');
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Set up billing for your fintech workspace in a minute.</p>

        {bannerError && <div className="form-banner form-banner-error">{bannerError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jordan Reyes"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? 'has-error' : ''}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jordan@company.com"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'has-error' : ''}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'has-error' : ''}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="field">
            <label htmlFor="phone">Phone number <span className="text-muted">(optional)</span></label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 555 000 1234"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
