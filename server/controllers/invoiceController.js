/**
 * SafeX Fintech - Invoices Controller
 * Developer: Ahmed Iqbal
 */

const db = require('../config/db');

/**
 * GET /api/invoices/:userId
 * Returns billing history invoices for a specific user
 */
exports.getInvoicesByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const isNumeric = !isNaN(userId) && !isNaN(parseFloat(userId));
        let queryText = `
            SELECT id, invoice_number, amount, tax_amount, total_amount, status, 
                   TO_CHAR(invoice_date, 'YYYY-MM-DD') AS invoice_date, 
                   due_date, paid_at
            FROM invoices
        `;

        let params = [];
        if (isNumeric) {
            queryText += ` WHERE user_id = $1 ORDER BY invoice_date DESC;`;
            params = [parseInt(userId, 10)];
        } else {
            queryText += ` WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1)) ORDER BY invoice_date DESC;`;
            params = [String(userId).trim()];
        }

        let { rows } = await db.query(queryText, params);

        const formatted = rows.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            amount: parseFloat(inv.amount || inv.total_amount || 0),
            status: inv.status
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching user invoices:', error.message);
        return res.status(200).json([]);
    }
};

/**
 * GET /api/invoices
 * Admin: Get all invoices with client names
 */
exports.getAllInvoices = async (req, res) => {
    try {
        const queryText = `
            SELECT i.id, i.invoice_number, u.name AS client_name, u.email AS client_email,
                   i.amount, i.tax_amount, i.total_amount, i.status, 
                   TO_CHAR(i.invoice_date, 'YYYY-MM-DD') AS invoice_date, i.due_date, i.paid_at
            FROM invoices i
            LEFT JOIN users u ON i.user_id = u.id
            ORDER BY i.invoice_date DESC;
        `;

        const { rows } = await db.query(queryText);
        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows.map(r => ({
                ...r,
                amount: parseFloat(r.amount),
                total_amount: parseFloat(r.total_amount)
            }))
        });
    } catch (error) {
        console.error('Error fetching all invoices:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
