/**
 * SafeX Fintech - Subscription Controller
 * Developer: Ahmed Iqbal
 */

const db = require('../config/db');

/**
 * GET /api/subscriptions/:userId
 * Returns client subscription status for Client Dashboard
 */
exports.getSubscriptionByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const isNumeric = !isNaN(userId);
        const queryText = `
            SELECT 
                s.id AS subscription_id,
                s.status,
                s.current_period_end,
                s.seat_quantity,
                p.id AS plan_id,
                p.name AS plan_name,
                p.price AS plan_price
            FROM subscriptions s
            JOIN pricing_plans p ON s.plan_id = p.id
            WHERE (${isNumeric ? 's.user_id = $1::integer' : 's.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))'})
            ORDER BY s.created_at DESC
            LIMIT 1;
        `;

        const { rows } = await db.query(queryText, [userId]);

        if (rows.length === 0) {
            return res.status(200).json({
                subscriptionId: null,
                planId: null,
                planName: 'No Active Plan',
                status: 'Inactive',
                nextBillingDate: null,
                amountDue: 0.00
            });
        }

        const sub = rows[0];
        const amountDue = parseFloat(sub.plan_price) * (sub.seat_quantity || 1);

        return res.status(200).json({
            subscriptionId: sub.subscription_id,
            planId: sub.plan_id,
            planName: sub.plan_name,
            status: sub.status,
            nextBillingDate: sub.current_period_end,
            amountDue: parseFloat(amountDue.toFixed(2))
        });
    } catch (error) {
        console.error('Error fetching subscription:', error.message);
        return res.status(200).json({
            subscriptionId: null,
            planId: null,
            planName: 'No Active Plan',
            status: 'Inactive',
            nextBillingDate: null,
            amountDue: 0.00
        });
    }
};

/**
 * PUT /api/subscriptions/:userId
 * Body: { planId }
 * Changes client plan with ACID transaction and invoice generation
 */
exports.changePlan = async (req, res) => {
    const { userId } = req.params;
    const { planId } = req.body;

    if (!planId) {
        return res.status(400).json({ success: false, message: 'planId is required' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Fetch Plan
        const planRes = await client.query('SELECT * FROM pricing_plans WHERE id = $1', [planId]);
        if (planRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        const plan = planRes.rows[0];

        // 2. Resolve User ID
        let resolvedUserId = isNaN(userId) ? null : parseInt(userId);
        if (!resolvedUserId) {
            const userLookup = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [userId]);
            if (userLookup.rows.length > 0) {
                resolvedUserId = userLookup.rows[0].id;
            } else {
                resolvedUserId = 1;
            }
        }

        // 3. Upsert Subscription
        const subCheck = await client.query('SELECT id FROM subscriptions WHERE user_id = $1 LIMIT 1', [resolvedUserId]);
        let subscriptionId;

        if (subCheck.rows.length > 0) {
            subscriptionId = subCheck.rows[0].id;
            await client.query(
                `UPDATE subscriptions
                 SET plan_id = $1,
                     status = 'Active',
                     current_period_start = CURRENT_TIMESTAMP,
                     current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [planId, subscriptionId]
            );
        } else {
            const newSub = await client.query(
                `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, seat_quantity)
                 VALUES ($1, $2, 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month', 1)
                 RETURNING id`,
                [resolvedUserId, planId]
            );
            subscriptionId = newSub.rows[0].id;
        }

        // 4. Generate new invoice for plan change
        const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const price = parseFloat(plan.price);
        const invRes = await client.query(
            `INSERT INTO invoices (invoice_number, user_id, subscription_id, amount, tax_amount, total_amount, amount_paid, status, invoice_date, due_date, paid_at)
             VALUES ($1, $2, $3, $4, 0.00, $4, $4, 'Paid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP)
             RETURNING id, invoice_number`,
            [invoiceNumber, resolvedUserId, subscriptionId, price]
        );

        // 5. Line item
        await client.query(
            `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price)
             VALUES ($1, $2, 1, $3, $3)`,
            [invRes.rows[0].id, `Subscription to ${plan.name} Plan`, price]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            planId: parseInt(planId),
            planName: plan.name,
            amountDue: price,
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Active',
            message: `Plan activated successfully: ${plan.name}`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error changing plan:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
