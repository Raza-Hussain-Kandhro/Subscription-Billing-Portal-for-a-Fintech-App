// Thin fetch wrapper around server/routes/planRoutes.js and subscriptionRoutes.js.

// eslint-disable-next-line no-unused-vars
const API_BASE = process.env.REACT_APP_API_BASE || '/api';

// eslint-disable-next-line no-unused-vars
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/** GET /plans — list all subscription plans (Basic/Pro/Premium). */
export async function getPlans() {
  // const res = await fetch(`${API_BASE}/plans`);
  // return handleResponse(res);
  const { MOCK_PLANS } = await import('../mockData');
  return MOCK_PLANS;
}

/** PUT /subscriptions/:userId — change the client's active plan. */
export async function changePlan(userId, planId) {
  // const res = await fetch(`${API_BASE}/subscriptions/${userId}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ planId }),
  // });
  // return handleResponse(res);
  return new Promise((resolve) => setTimeout(() => resolve({ planId }), 400));
}

/** POST /plans — admin: add a new plan. */
export async function createPlan(plan) {
  // const res = await fetch(`${API_BASE}/plans`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(plan),
  // });
  // return handleResponse(res);
  return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...plan }), 400));
}

/** PUT /plans/:id — admin: edit an existing plan. */
export async function updatePlan(id, plan) {
  // const res = await fetch(`${API_BASE}/plans/${id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(plan),
  // });
  // return handleResponse(res);
  return new Promise((resolve) => setTimeout(() => resolve({ id, ...plan }), 400));
}

/** DELETE /plans/:id — admin: remove a plan. */
export async function deletePlan(id) {
  // const res = await fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' });
  // return handleResponse(res);
  return new Promise((resolve) => setTimeout(() => resolve({ id }), 300));
}
