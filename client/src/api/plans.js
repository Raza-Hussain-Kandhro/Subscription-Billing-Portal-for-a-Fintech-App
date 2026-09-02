// Thin fetch wrapper around server/routes/planRoutes.js and subscriptionRoutes.js.
// Connects to Express + Supabase PostgreSQL Backend with graceful fallback

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/** GET /plans — list all subscription plans (Basic/Pro/Premium). */
export async function getPlans() {
  try {
    const res = await fetch(`${API_BASE}/plans`);
    return await handleResponse(res);
  } catch (err) {
    const { MOCK_PLANS } = await import('../mockData');
    return MOCK_PLANS;
  }
}

/** PUT /subscriptions/:userId — change the client's active plan. */
export async function changePlan(userId, planId) {
  try {
    const res = await fetch(`${API_BASE}/subscriptions/${userId || 1}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    return await handleResponse(res);
  } catch (err) {
    return { planId };
  }
}

/** POST /plans — admin: add a new plan. */
export async function createPlan(plan) {
  try {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    return await handleResponse(res);
  } catch (err) {
    return { id: Date.now(), ...plan };
  }
}

/** PUT /plans/:id — admin: edit an existing plan. */
export async function updatePlan(id, plan) {
  try {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    return await handleResponse(res);
  } catch (err) {
    return { id, ...plan };
  }
}

/** DELETE /plans/:id — admin: remove a plan. */
export async function deletePlan(id) {
  try {
    const res = await fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (err) {
    return { id };
  }
}
