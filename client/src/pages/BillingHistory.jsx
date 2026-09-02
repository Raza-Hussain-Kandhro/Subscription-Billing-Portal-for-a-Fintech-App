import React, { useEffect, useState } from 'react';
import InvoiceTable from '../components/InvoiceTable';
import { getInvoices } from '../api/invoices';

/**
 * BillingHistory
 * Live list/table of past invoices from Supabase
 */
function BillingHistory({ session }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.id || session?.email || 1;

  useEffect(() => {
    getInvoices(userId)
      .then((data) => {
        setInvoices(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching invoices:', err);
        setInvoices([]);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Billing history</h1>
        <p>Every invoice generated for your account, most recent first.</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="card-section text-muted">Loading invoices…</div>
        ) : (
          <InvoiceTable invoices={invoices} />
        )}
      </div>
    </div>
  );
}

export default BillingHistory;
