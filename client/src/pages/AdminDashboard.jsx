import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';
import { createPlan, updatePlan, deletePlan } from '../api/plans';

const TABS = [
  { key: 'overview', label: 'Overview', path: '/admin' },
  { key: 'clients', label: 'Clients', path: '/admin/clients' },
  { key: 'plans', label: 'Plans', path: '/admin/plans' },
];

const EMPTY_PLAN_FORM = { name: '', price: '', features: '' };

/**
 * AdminDashboard
 * Full real-time Admin Management connected to Supabase PostgreSQL
 */
function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find((t) => t.path === location.pathname)?.key || 'overview';

  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null); // plan being edited, or 'new'
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);

  const loadData = () => {
    Promise.all([
      fetch('/api/admin/clients').then((r) => r.json()).catch(() => []),
      fetch('/api/plans').then((r) => r.json()).catch(() => []),
    ]).then(([clientsData, plansData]) => {
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    totalClients: clients.length,
    activeSubscriptions: clients.filter((c) => c.status === 'Active' && c.plan !== 'No Plan').length,
    totalPlans: plans.length,
  };

  const handleDeactivate = async (id) => {
    const target = clients.find((c) => c.id === id);
    const nextStatus = target?.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await fetch(`/api/admin/clients/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openNewPlan = () => {
    setPlanForm(EMPTY_PLAN_FORM);
    setEditingPlan('new');
  };

  const openEditPlan = (plan) => {
    const feats = Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '';
    setPlanForm({ name: plan.name, price: plan.price, features: feats });
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
      await createPlan(payload);
    } else {
      await updatePlan(editingPlan.id, payload);
    }
    closePlanForm();
    loadData();
  };

  const handleDeletePlan = async (id) => {
    await deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Admin dashboard</h1>
        <p>Live management of clients, billing accounts, and subscription tiers.</p>
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

      {loading && <p className="text-muted">Loading live administrative data…</p>}

      {!loading && activeTab === 'overview' && (
        <div className="metric-grid admin-metric-grid">
          <div className="card metric-card">
            <span className="metric-label">Total registered clients</span>
            <span className="metric-value">{stats.totalClients}</span>
            <span className="text-muted metric-caption">Live from Supabase Database</span>
          </div>
          <div className="card metric-card">
            <span className="metric-label">Active subscriptions</span>
            <span className="metric-value">{stats.activeSubscriptions}</span>
            <span className="text-muted metric-caption">Paying clients with active tier</span>
          </div>
          <div className="card metric-card">
            <span className="metric-label">Total pricing plans</span>
            <span className="metric-value">{stats.totalPlans}</span>
            <span className="text-muted metric-caption">Configured billing tiers</span>
          </div>
        </div>
      )}

      {!loading && activeTab === 'clients' && (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Email</th>
                  <th>Current Plan</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td className="text-muted">{c.email}</td>
                    <td>
                      <span className="badge badge-primary">{c.plan || 'No Plan'}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${c.status === 'Active' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleDeactivate(c.id)}
                      >
                        {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'plans' && (
        <div>
          <div className="admin-actions-bar">
            <button className="btn btn-primary" onClick={openNewPlan}>
              + Add New Plan
            </button>
          </div>

          {editingPlan && (
            <div className="card modal-card">
              <h3>{editingPlan === 'new' ? 'Create New Pricing Plan' : 'Edit Plan'}</h3>
              <form onSubmit={savePlan}>
                <div className="field">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Monthly Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Features (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="1 billing account, Priority support, API access"
                    value={planForm.features}
                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closePlanForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Plan
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="plan-grid">
            {plans.map((p) => (
              <div key={p.id} className="card plan-card">
                <h3>{p.name}</h3>
                <div className="plan-price">${p.price}<span>/mo</span></div>
                <ul className="plan-features">
                  {(Array.isArray(p.features) ? p.features : []).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <div className="plan-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEditPlan(p)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeletePlan(p.id)}>
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
