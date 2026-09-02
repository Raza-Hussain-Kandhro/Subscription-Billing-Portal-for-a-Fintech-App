// SafeX Fintech - Invoices API Layer
// Connects directly to Node.js / Express REST API and Supabase PostgreSQL Database

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/** GET /api/invoices/:userId — a client's real billing history from Supabase. */
export async function getInvoices(userId) {
  const res = await fetch(`${API_BASE}/invoices/${userId || 1}`);
  return await handleResponse(res);
}
