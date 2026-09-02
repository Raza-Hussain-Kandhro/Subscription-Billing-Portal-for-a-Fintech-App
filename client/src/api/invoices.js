// Thin fetch wrapper around server/routes/invoiceRoutes.js.
// Connects to Express + Supabase PostgreSQL Backend with graceful fallback

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

/** GET /invoices/:userId — a client's billing history (date, amount, status). */
export async function getInvoices(userId) {
  try {
    const res = await fetch(`${API_BASE}/invoices/${userId || 1}`);
    return await handleResponse(res);
  } catch (err) {
    const { MOCK_INVOICES } = await import('../mockData');
    return MOCK_INVOICES;
  }
}
