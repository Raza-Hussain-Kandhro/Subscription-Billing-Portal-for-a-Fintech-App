/**
 * SafeX Fintech - Billing & Database Controllers
 * Student: Ahmed Iqbal
 * Assisting: Muhammad Hassan (Node.js/Express) with Database Integration Layer
 */

const db = require('../config/db');

// ============================================================================
// 1. GET ALL PRICING PLANS
// ============================================================================
exports.getPlans = async (req, res) => {
    try {
        const queryText = `
            SELECT id, plan_code, name, description, billing_interval, base_price, currency, 
                   trial_period_days, max_team_seats, monthly_api_credit_limit
            FROM pricing_plans
            WHERE is_active = true
            ORDER BY base_price ASC;
        `;
        const { rows } = await db.query(queryText);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching plans:', error.message);
        res.status(500).json({ success: false, error: 'Database query failed: ' + error.message });
    }
};

// ============================================================================
// 2. GET CUSTOMER 360 BILLING OVERVIEW
// ============================================================================
exports.getCustomerOverview = async (req, res) => {
    const { email } = req.params;
    try {
        const queryText = `
            SELECT 
                o.id AS organization_id,
                o.name AS organization_name,
                o.billing_email,
                o.tax_id,
                o.currency,
                p.name AS current_plan,
                p.base_price AS plan_price,
                p.billing_interval,
                s.status AS subscription_status,
                s.current_period_start,
                s.current_period_end,
                s.seat_quantity,
                pm.card_brand,
                pm.card_last4,
                COALESCE(SUM(inv.total_amount), 0.00) AS total_billed_amount,
                COALESCE(SUM(inv.amount_remaining), 0.00) AS pending_balance
            FROM organizations o
            LEFT JOIN subscriptions s ON o.id = s.organization_id AND s.status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
            LEFT JOIN pricing_plans p ON s.plan_id = p.id
            LEFT JOIN payment_methods pm ON s.default_payment_method_id = pm.id
            LEFT JOIN invoices inv ON o.id = inv.organization_id
            WHERE o.billing_email = $1
            GROUP BY o.id, o.name, o.billing_email, o.tax_id, o.currency, p.name, p.base_price, p.billing_interval, 
                     s.status, s.current_period_start, s.current_period_end, s.seat_quantity, pm.card_brand, pm.card_last4;
        `;
        const { rows } = await db.query(queryText, [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching customer overview:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================================
// 3. CREATE SUBSCRIPTION & INVOICE ATOMICALLY (ACID Transaction)
// ============================================================================
exports.createSubscription = async (req, res) => {
    const { organization_id, plan_id, payment_method_id, seat_quantity = 1 } = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN'); // Start ACID Transaction

        // 1. Fetch Plan details
        const planRes = await client.query('SELECT * FROM pricing_plans WHERE id = $1', [plan_id]);
        if (planRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        const plan = planRes.rows[0];

        // 2. Create Subscription
        const subInsertQuery = `
            INSERT INTO subscriptions (organization_id, plan_id, default_payment_method_id, status, 
                                       current_period_start, current_period_end, seat_quantity)
            VALUES ($1, $2, $3, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month', $4)
            RETURNING id, current_period_start, current_period_end;
        `;
        const subRes = await client.query(subInsertQuery, [organization_id, plan_id, payment_method_id, seat_quantity]);
        const subscription = subRes.rows[0];

        // 3. Calculate Amounts
        const subtotal = Number(plan.base_price) * Number(seat_quantity);
        const tax = Number((subtotal * 0.08).toFixed(2)); // 8% standard tax
        const total = Number((subtotal + tax).toFixed(2));
        const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

        // 4. Create Initial Invoice
        const invInsertQuery = `
            INSERT INTO invoices (invoice_number, organization_id, subscription_id, status, subtotal_amount, 
                                  tax_amount, total_amount, amount_paid, amount_remaining, due_date, paid_at)
            VALUES ($1, $2, $3, 'PAID', $4, $5, $6, $6, 0.00, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP)
            RETURNING id, invoice_number, total_amount, status;
        `;
        const invRes = await client.query(invInsertQuery, [invoiceNumber, organization_id, subscription.id, subtotal, tax, total]);
        const invoice = invRes.rows[0];

        // 5. Create Line Item
        const itemInsertQuery = `
            INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_amount, total_amount)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(itemInsertQuery, [invoice.id, `${plan.name} (${seat_quantity} Seats)`, seat_quantity, plan.base_price, subtotal]);

        await client.query('COMMIT'); // Commit ACID Transaction

        res.status(201).json({
            success: true,
            message: 'Subscription created and invoice generated successfully',
            data: {
                subscription_id: subscription.id,
                invoice_number: invoice.invoice_number,
                total_amount: invoice.total_amount,
                status: 'ACTIVE'
            }
        });
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on any failure
        console.error('Error creating subscription transaction:', error.message);
        res.status(500).json({ success: false, error: 'Transaction rolled back: ' + error.message });
    } finally {
        client.release();
    }
};

// ============================================================================
// 4. GET INVOICES FOR AN ORGANIZATION
// ============================================================================
exports.getInvoices = async (req, res) => {
    const { organization_id } = req.query;
    try {
        let queryText = `
            SELECT i.id, i.invoice_number, o.name AS organization_name, i.status, i.subtotal_amount, 
                   i.tax_amount, i.total_amount, i.amount_paid, i.amount_remaining, i.issue_date, i.due_date, i.paid_at
            FROM invoices i
            JOIN organizations o ON i.organization_id = o.id
        `;
        const params = [];
        if (organization_id) {
            queryText += ` WHERE i.organization_id = $1`;
            params.push(organization_id);
        }
        queryText += ` ORDER BY i.issue_date DESC;`;

        const { rows } = await db.query(queryText, params);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching invoices:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================================
// 5. GET MRR & ARR ANALYTICS
// ============================================================================
exports.getMrrAnalytics = async (req, res) => {
    try {
        const queryText = `SELECT * FROM vw_monthly_recurring_revenue;`;
        const { rows } = await db.query(queryText);
        
        let totalMrr = 0;
        let totalArr = 0;
        rows.forEach(r => {
            totalMrr += parseFloat(r.normalized_monthly_mrr || 0);
            totalArr += parseFloat(r.normalized_annual_arr || 0);
        });

        res.status(200).json({
            success: true,
            summary: {
                total_mrr: totalMrr.toFixed(2),
                total_arr: totalArr.toFixed(2),
                active_plans_count: rows.length
            },
            breakdown: rows
        });
    } catch (error) {
        console.error('Error fetching MRR analytics:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================================
// 6. RECORD METERED USAGE EVENT
// ============================================================================
exports.recordUsage = async (req, res) => {
    const { subscription_id, metric_type, quantity_used, unit_price = 0.0001 } = req.body;
    try {
        const queryText = `
            INSERT INTO usage_records (subscription_id, metric_type, quantity_used, unit_price)
            VALUES ($1, $2, $3, $4)
            RETURNING id, metric_type, quantity_used, recorded_at;
        `;
        const { rows } = await db.query(queryText, [subscription_id, metric_type, quantity_used, unit_price]);
        res.status(201).json({ success: true, message: 'Usage event logged', data: rows[0] });
    } catch (error) {
        console.error('Error logging usage:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
