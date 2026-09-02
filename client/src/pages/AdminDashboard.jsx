import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';
import { MOCK_CLIENTS, MOCK_PLANS } from '../mockData';
import { createPlan, updatePlan, deletePlan } from '../api/plans';

const TABS = [
  { key: 'overview', label: 'Overview', path: '/admin' },
  { key: 'clients', label: 'Clients', path: '/admin/clients' },
  { key: 'plans', label: 'Plans', path: '/admin/plans' },
];

const EMPTY_PLAN_FORM = { name: '', price: '', features: '' };

/**
 * AdminDashboard
 * SRS 3.2.2, 3.2.3, 3.2.4 — one page with three tabs:
 *  - Overview: total clients, active subscriptions, total plans
 *  - Clients: management table with a Deactivate action
 *  - Plans: management view with Add / Edit / Delete
 *
 * The active tab is derived from the current route so /admin,
 * /admin/clients and /admin/plans each deep-link correctly.
 */
function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find((t) => t.path === location.pathname)?.key || 'overview';

  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [plans, setPlans] = useState(MOCK_PLANS);
  const [editingPlan, setEditingPlan] = useState(null); // plan being edited, or 'new'
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);

  const stats = {
    totalClients: clients.length,
    activeSubscriptions: clients.filter((c) => c.status === 'Active').length,
    totalPlans: plans.length,
  };

  const handleDeactivate = (id) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Inactive' } : c)));
  };

  const openNewPlan = () => {
    setPlanForm(EMPTY_PLAN_FORM);
    setEditingPlan('new');
  };

  const openEditPlan = (plan) => {
    setPlanForm({ name: plan.name, price: plan.price, features: plan.features.join(', ') });
    setEditingPlan(plan);
  };

  const closePlanForm = () => {
    setEditingPlan(null);
    setPlanForm(EMPTY_PLAN_FORM);
  };

  const savePlan = async (e) => {
    e.preventDefault();
    const payload = {
      name: planForm.name,
      price: Number(planForm.price),
      features: planForm.features.split(',').map((f) => f.trim()).filter(Boolean),
    };

    if (editingPlan === 'new') {
      const created = await createPlan(payload);
      setPlans((prev) => [...prev, { ...payload, id: created.id }]);
    } else {
      await updatePlan(editingPlan.id, payload);
      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? { ...p, ...payload } : p)));
    }
    closePlanForm();
  };

  const handleDeletePlan = async (id) => {
    await deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Admin dashboard</h1>
        <p>Manage clients and subscription plans across the portal.</p>
      </div>

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="metric-grid admin-metric-grid">
          <div className="card metric-card">
            <span className="metric-label">Total clients</span>
            <span className="metric-value">{stats.totalClients}</span>
          </div>
          <div className="card metric-card">
            <span className="metric-label">Active subscriptions</span>
            <span className="metric-value">{stats.activeSubscriptions}</span>
          </div>
          <div className="card metric-card">
            <span className="metric-label">Total plans</span>
            <span className="metric-value">{stats.totalPlans}</span>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="card">
          <div className="card-section section-heading">
            <h2>Registered clients</h2>
            <span className="text-muted">{clients.length} total</span>
          </div>
          <div className="admin-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-name-cell">
                        <span>{client.name}</span>
                        <span className="text-muted">{client.email}</span>
                      </div>
                    </td>
                    <td>{client.plan}</td>
                    <td>
                      <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={client.status === 'Inactive'}
                        onClick={() => handleDeactivate(client.id)}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="card">
          <div className="card-section section-heading">
            <h2>Subscription plans</h2>
            <button className="btn btn-primary btn-sm" onClick={openNewPlan}>
              + Add new plan
            </button>
          </div>

          {editingPlan && (
            <div className="card-section">
              <form className="plan-form" onSubmit={savePlan}>
                <div className="field">
                  <label htmlFor="plan-name">Plan name</label>
                  <input
                    id="plan-name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="plan-price">Price ($/month)</label>
                  <input
                    id="plan-price"
                    type="number"
                    min="0"
                    value={planForm.price}
                    onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="plan-features">Features (comma-separated)</label>
                  <input
                    id="plan-features"
                    value={planForm.features}
                    onChange={(e) => setPlanForm((p) => ({ ...p, features: e.target.value }))}
                    placeholder="Priority support, Advanced reporting"
                  />
                </div>
                <div className="plan-form-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closePlanForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    {editingPlan === 'new' ? 'Add plan' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="admin-plan-list">
            {plans.map((plan) => (
              <div className="admin-plan-row" key={plan.id}>
                <div>
                  <span className="admin-plan-name">{plan.name}</span>
                  <span className="text-muted admin-plan-features">{plan.features.join(' · ')}</span>
                </div>
                <div className="admin-plan-row-right">
                  <span className="admin-plan-price">${plan.price}/mo</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditPlan(plan)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlan(plan.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
