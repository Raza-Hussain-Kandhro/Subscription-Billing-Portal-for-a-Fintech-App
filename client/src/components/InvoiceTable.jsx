import React from 'react';
import '../styles/InvoiceTable.css';

/**
 * InvoiceTable
 * Displays a list of invoices: date, amount, status.
 *
 * Props:
 *  - invoices: { id, invoice_date, amount, status }[]
 */
function InvoiceTable({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="invoice-table-empty">
        <p>No invoices yet</p>
        <span>Your billing history will show up here once your first invoice is generated.</span>
      </div>
    );
  }

  return (
    <div className="invoice-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                {new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td>${invoice.amount.toFixed(2)}</td>
              <td>
                <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                  {invoice.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceTable;
