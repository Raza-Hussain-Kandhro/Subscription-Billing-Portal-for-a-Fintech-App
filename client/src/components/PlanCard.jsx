import React from 'react';
import '../styles/PlanCard.css';

/**
 * PlanCard
 * Renders a single plan tier (Basic / Pro / Premium).
 * The action button label/behavior is dynamic based on how the plan
 * compares to the client's current plan (handled by the parent, which
 * passes `buttonLabel` and `variant`).
 *
 * Props:
 *  - plan: { id, name, price, features: string[] }
 *  - isCurrent: boolean
 *  - buttonLabel: 'Current Plan' | 'Upgrade' | 'Downgrade'
 *  - highlighted: boolean -> visually emphasize (e.g. Pro as "most popular")
 *  - onSelect: fn(plan)
 */
function PlanCard({ plan, isCurrent, buttonLabel, highlighted, onSelect }) {
  return (
    <div className={`plan-card ${highlighted ? 'plan-card-highlighted' : ''} ${isCurrent ? 'plan-card-current' : ''}`}>
      {highlighted && <span className="plan-card-tag">Most popular</span>}

      <h3 className="plan-card-name">{plan.name}</h3>

      <div className="plan-card-price">
        <span className="plan-card-amount">${plan.price}</span>
        <span className="plan-card-period">/month</span>
      </div>

      <ul className="plan-card-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <span className="plan-card-check">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        className={`btn btn-block ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
        disabled={isCurrent}
        onClick={() => onSelect(plan)}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default PlanCard;
