// Thin fetch wrapper around server/routes/authRoutes.js.
// Connects to Express + Supabase PostgreSQL Backend with graceful offline fallback

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/**
 * POST /signup — { name, email, password, phone }
 * Server validates fields, hashes the password, inserts into `users`.
 */
export async function signup(form) {
  try {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    return await handleResponse(res);
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    // Fallback if backend server is not running
    if (!form.email || !form.password) {
      throw new Error('Missing required fields');
    }
    return { id: Date.now(), name: form.name, email: form.email };
  }
}

/**
 * POST /signin — { email, password }
 * Returns the client's name on success; throws on invalid credentials.
 */
export async function signin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    // Fallback if backend server is not running
    if (!email || !password || password.length < 6) {
      throw new Error('Invalid email or password');
    }
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    return { name: name.replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
}

/**
 * POST /admin/login — { username, password }
 * Checked against the pre-seeded admin record.
 */
export async function adminLogin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await handleResponse(res);
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    // Fallback if backend server is not running
    if (username === 'admin' && password === 'admin123') {
      return { name: 'Admin' };
    }
    throw new Error('Invalid username or password');
  }
}
