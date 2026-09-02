// SafeX Fintech - Authentication API Layer
// Connects directly to Node.js / Express REST API and Supabase PostgreSQL Database

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/**
 * POST /api/signup — { name, email, password, phone }
 * Inserts real client record into Supabase PostgreSQL `users` table.
 */
export async function signup(form) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  return await handleResponse(res);
}

/**
 * POST /api/signin — { email, password }
 * Authenticates client against Supabase PostgreSQL `users` table.
 * Rejects invalid credentials.
 */
export async function signin(email, password) {
  const res = await fetch(`${API_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await handleResponse(res);
}

/**
 * POST /api/admin/login — { username, password }
 * Authenticates admin against Supabase PostgreSQL `admins` table.
 */
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return await handleResponse(res);
}
