import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import { MOCK_CLIENT_SUBSCRIPTION } from '../mockData';

/**
 * ClientDashboard
 * SRS 3.1.3 — greeting, current plan, next billing date, amount due,
 * plan status. Data is loaded into local state so it's easy to swap
 * the mock import for a real GET /subscriptions/:userId call.
 *
 * Props:
 *  - userName: string
 */
function ClientDashboard({ userName = 'there' }) {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetch('/api/subscriptions/1')
      .then(res => res.json())
      .then(data => setSubscription(data))
      .catch(() => setSubscription(MOCK_CLIENT_SUBSCRIPTION));
  }, []);

  if (!subscription) {
    return (
      <div className="page-content">
        <p className="text-muted">Loading your dashboard…</p>
      </div>
    );
  }

  const isActive = subscription.status === 'Active';
  const formattedDate = new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Welcome back, {userName.split(' ')[0]}</h1>
        <p>Here's a quick look at your subscription.</p>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <span className="metric-label">Current plan</span>
          <span className="metric-value">{subscription.planName}</span>
          <span className="text-muted metric-caption">Change it anytime from Plans</span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Plan status</span>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'} metric-badge`}>
            {subscription.status}
          </span>
          <span className="text-muted metric-caption">
            {isActive ? 'Billing is running normally' : 'Reactivate to restore access'}
          </span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Next billing date</span>
          <span className="metric-value">{formattedDate}</span>
          <span className="text-muted metric-caption">Auto-billed to your account on file</span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Amount due</span>
          <span className="metric-value">${subscription.amountDue.toFixed(2)}</span>
          <span className="text-muted metric-caption">Due on next billing date</span>
        </div>
      </div>

      <div className="card dashboard-cta">
        <div>
          <h3>Want more from your plan?</h3>
          <p className="text-muted">Compare tiers and upgrade or downgrade in a couple of clicks.</p>
        </div>
        <Link to="/plans" className="btn btn-primary">
          View & change plan
        </Link>
      </div>
    </div>
  );
}

export default ClientDashboard;
