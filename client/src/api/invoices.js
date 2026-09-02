// Thin fetch wrapper around server/routes/invoiceRoutes.js.

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

/** GET /invoices/:userId — a client's billing history (date, amount, status). */
export async function getInvoices(userId) {
  // const res = await fetch(`${API_BASE}/invoices/${userId}`);
  // return handleResponse(res);
  const { MOCK_INVOICES } = await import('../mockData');
  return MOCK_INVOICES;
}
