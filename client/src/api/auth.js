// Thin fetch wrapper around server/routes/authRoutes.js.
// Swap API_BASE for your deployed backend URL when wiring this up for real.

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

/**
 * POST /signup — { name, email, password, phone }
 * Server validates fields, hashes the password, inserts into `users`.
 */
export async function signup(form) {
  // --- Backend call (uncomment once authRoutes.js is running) ---
  // const res = await fetch(`${API_BASE}/signup`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(form),
  // });
  // return handleResponse(res);

  // --- Mock implementation for demo/frontend-only mode ---
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!form.email || !form.password) {
        reject(new Error('Missing required fields'));
      } else {
        resolve({ id: Date.now(), name: form.name, email: form.email });
      }
    }, 500);
  });
}

/**
 * POST /signin — { email, password }
 * Returns the client's name on success; throws on invalid credentials.
 */
export async function signin(email, password) {
  // const res = await fetch(`${API_BASE}/signin`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // return handleResponse(res);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password || password.length < 8) {
        reject(new Error('Invalid email or password'));
      } else {
        const name = email.split('@')[0].replace(/[._]/g, ' ');
        resolve({ name: name.replace(/\b\w/g, (c) => c.toUpperCase()) });
      }
    }, 500);
  });
}

/**
 * POST /admin/login — { username, password }
 * Checked against the pre-seeded admin record (no admin signup exists).
 */
export async function adminLogin(username, password) {
  // const res = await fetch(`${API_BASE}/admin/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, password }),
  // });
  // return handleResponse(res);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        resolve({ name: 'Admin' });
      } else {
        reject(new Error('Invalid username or password'));
      }
    }, 500);
  });
}
