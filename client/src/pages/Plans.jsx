import React, { useEffect, useState } from 'react';
import PlanCard from '../components/PlanCard';
import { getPlans, changePlan } from '../api/plans';
import '../styles/Dashboard.css';

/**
 * Plans (View & Change Plan)
 * SRS 3.1.4 — shows Basic/Pro/Premium with price + features. Button
 * label is dynamic: "Current Plan" (disabled), "Upgrade" if the target
 * tier is priced higher than the client's current plan, "Downgrade"
 * otherwise.
 */
function Plans() {
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(2); // demo: client is on Pro
  const [confirming, setConfirming] = useState(null);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  const currentPlan = plans.find((p) => p.id === currentPlanId);

  const handleSelect = (plan) => {
    setConfirming(plan);
    setBanner('');
  };

  const confirmChange = async () => {
    if (!confirming) return;
    await changePlan(1, confirming.id); // demo user id
    setCurrentPlanId(confirming.id);
    setBanner(`You're now on the ${confirming.name} plan.`);
    setConfirming(null);
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>View & change plan</h1>
        <p>Compare tiers and switch whenever your needs change — takes effect on your next billing cycle.</p>
      </div>

      {banner && <div className="form-banner form-banner-success">{banner}</div>}

      {confirming && (
        <div className="form-banner form-banner-error plan-confirm-banner">
          <span>
            {confirming.price > (currentPlan?.price || 0) ? 'Upgrade' : 'Downgrade'} to{' '}
            <strong>{confirming.name}</strong> for ${confirming.price}/month?
          </span>
          <div className="plan-confirm-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" onClick={confirmChange}>
              Confirm
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
