// SafeX Fintech - Plans & Subscriptions API Layer
// Connects directly to Node.js / Express REST API and Supabase PostgreSQL Database

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/** GET /api/plans — list all subscription plans from Supabase. */
export async function getPlans() {
  const res = await fetch(`${API_BASE}/plans`);
  return await handleResponse(res);
}

/** PUT /api/subscriptions/:userId — change active plan in Supabase. */
export async function changePlan(userId, planId) {
  const res = await fetch(`${API_BASE}/subscriptions/${userId || 1}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  return await handleResponse(res);
}

/** POST /api/plans — admin: add a new plan into Supabase. */
export async function createPlan(plan) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  return await handleResponse(res);
}

/** PUT /api/plans/:id — admin: edit an existing plan in Supabase. */
export async function updatePlan(id, plan) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  return await handleResponse(res);
}

/** DELETE /api/plans/:id — admin: remove a plan from Supabase. */
export async function deletePlan(id) {
  const res = await fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' });
  return await handleResponse(res);
}
