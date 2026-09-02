import React, { useEffect, useState } from 'react';
import PlanCard from '../components/PlanCard';
import { getPlans, changePlan } from '../api/plans';
import '../styles/Dashboard.css';

/**
 * Plans (View & Change Plan)
 * Connects directly to Supabase PostgreSQL for dynamic user plan changes
 */
function Plans({ session }) {
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = session?.id || session?.email || 1;

  useEffect(() => {
    // 1. Fetch available plans
    getPlans().then((data) => setPlans(data || []));

    // 2. Fetch current client's actual subscription
    fetch(`/api/subscriptions/${userId}`)
      .then((res) => res.json())
      .then((sub) => {
        if (sub && sub.planId) {
          setCurrentPlanId(sub.planId);
        }
      })
      .catch((err) => console.error('Error loading current plan:', err));
  }, [userId]);

  const currentPlan = plans.find((p) => p.id === currentPlanId);

  const handleSelect = (plan) => {
    setConfirming(plan);
    setBanner('');
  };

  const confirmChange = async () => {
    if (!confirming) return;
    setSubmitting(true);
    try {
      await changePlan(userId, confirming.id);
      setCurrentPlanId(confirming.id);
      setBanner(`Success! You have activated the ${confirming.name} plan.`);
      setConfirming(null);
    } catch (err) {
      setBanner(`Error updating plan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>View & change plan</h1>
        <p>Compare tiers and switch whenever your needs change — instant activation with ACID transaction safety.</p>
      </div>

      {banner && <div className="form-banner form-banner-success">{banner}</div>}

      {confirming && (
        <div className="form-banner form-banner-error plan-confirm-banner">
          <span>
            {currentPlan
              ? `${confirming.price > currentPlan.price ? 'Upgrade' : 'Downgrade'} to ${confirming.name} for $${confirming.price}/month?`
              : `Activate ${confirming.name} plan for $${confirming.price}/month?`}
          </span>
          <div className="plan-confirm-actions">
            <button className="btn btn-sm btn-secondary" disabled={submitting} onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" disabled={submitting} onClick={confirmChange}>
              {submitting ? 'Activating…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      <div className="plan-grid">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          let buttonLabel = 'Select plan';
          if (isCurrent) {
            buttonLabel = 'Current plan';
          } else if (currentPlan) {
            buttonLabel = plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade';
          }

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={isCurrent}
              buttonLabel={buttonLabel}
              highlighted={plan.name === 'Pro'}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Plans;
