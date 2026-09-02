import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

/**
 * ClientDashboard
 * Dynamic user billing dashboard connected to Supabase PostgreSQL
 */
function ClientDashboard({ session, userName = 'there' }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.id || session?.email || 1;

  useEffect(() => {
    fetch(`/api/subscriptions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading subscription:', err);
        setSubscription({
          planName: 'No Active Plan',
          status: 'Inactive',
          nextBillingDate: null,
          amountDue: 0.0,
        });
        setLoading(false);
      });
  }, [userId]);

  if (loading || !subscription) {
    return (
      <div className="page-content">
        <p className="text-muted">Loading your billing dashboard…</p>
      </div>
    );
  }

  const isActive = subscription.status === 'Active';
  const hasPlan = subscription.planName && subscription.planName !== 'No Active Plan';
  const formattedDate = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not Scheduled';

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Welcome back, {userName.split(' ')[0]}</h1>
        <p>Here's a quick look at your subscription & billing status.</p>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <span className="metric-label">Current plan</span>
          <span className="metric-value">{subscription.planName}</span>
          <span className="text-muted metric-caption">
            {hasPlan ? 'Change or upgrade anytime' : 'Choose a plan to activate billing'}
          </span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Plan status</span>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'} metric-badge`}>
            {subscription.status}
          </span>
          <span className="text-muted metric-caption">
            {isActive ? 'Billing is running normally' : 'Activate a plan to restore access'}
          </span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Next billing date</span>
          <span className="metric-value">{formattedDate}</span>
          <span className="text-muted metric-caption">
            {isActive ? 'Auto-billed to your account on file' : 'No upcoming charges'}
          </span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Amount due</span>
          <span className="metric-value">${(subscription.amountDue || 0).toFixed(2)}</span>
          <span className="text-muted metric-caption">
            {isActive ? 'Due on next billing date' : 'No balance due'}
          </span>
        </div>
      </div>

      <div className="card dashboard-cta">
        <div>
          <h3>{hasPlan ? 'Want to change or upgrade your plan?' : 'Choose a Subscription Plan'}</h3>
          <p className="text-muted">
            {hasPlan
              ? 'Compare tiers and switch plans with automated prorated billing.'
              : 'Select Basic, Pro, or Premium tier to activate your fintech workspace.'}
          </p>
        </div>
        <Link to="/plans" className="btn btn-primary">
          {hasPlan ? 'View & change plan' : 'Select a Plan'}
        </Link>
      </div>
    </div>
  );
}

export default ClientDashboard;
