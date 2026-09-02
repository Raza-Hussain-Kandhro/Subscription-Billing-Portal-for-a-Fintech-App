import React, { useEffect, useState } from 'react';
import InvoiceTable from '../components/InvoiceTable';
import { getInvoices } from '../api/invoices';

/**
 * BillingHistory
 * SRS 3.1.5 — a list/table of past invoices: date, amount, status.
 */
function BillingHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoices(1).then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

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
