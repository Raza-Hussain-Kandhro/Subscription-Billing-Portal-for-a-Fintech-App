-- ============================================================================
-- SafeX Fintech - Key Operational & Analytical Database Queries
-- Student: Ahmed Iqbal
-- Role: Member 6 - Database Architecture & Data Modeling (PostgreSQL)
-- ============================================================================

-- ============================================================================
-- QUERY 1: Real-Time Monthly Recurring Revenue (MRR) & Annual Run Rate (ARR)
-- Business Goal: Executive financial dashboard to track subscription growth.
-- ============================================================================
SELECT 
    p.name AS plan_tier,
    p.billing_interval,
    COUNT(s.id) AS active_subscribers,
    SUM(s.seat_quantity) AS total_seats_allocated,
    SUM(
        CASE 
            WHEN p.billing_interval = 'MONTHLY' THEN p.base_price * s.seat_quantity
            WHEN p.billing_interval = 'QUARTERLY' THEN (p.base_price * s.seat_quantity) / 3.0
            WHEN p.billing_interval = 'YEARLY' THEN (p.base_price * s.seat_quantity) / 12.0
            ELSE 0.00
        END
    ) AS monthly_recurring_revenue_mrr,
    SUM(
        CASE 
            WHEN p.billing_interval = 'MONTHLY' THEN (p.base_price * s.seat_quantity) * 12.0
            WHEN p.billing_interval = 'QUARTERLY' THEN (p.base_price * s.seat_quantity) * 4.0
            WHEN p.billing_interval = 'YEARLY' THEN (p.base_price * s.seat_quantity)
            ELSE 0.00
        END
    ) AS annualized_run_rate_arr
FROM subscriptions s
JOIN pricing_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
GROUP BY p.name, p.billing_interval
ORDER BY monthly_recurring_revenue_mrr DESC;


-- ============================================================================
-- QUERY 2: Customer Billing Portal Overview (Customer 360 View)
-- Business Goal: Fetch everything needed to render the client's billing dashboard.
-- ============================================================================
SELECT 
    o.name AS organization_name,
    o.billing_email,
    o.tax_id,
    p.name AS current_plan,
    s.status AS subscription_status,
    s.current_period_start,
    s.current_period_end,
    s.seat_quantity,
    pm.card_brand,
    pm.card_last4,
    COALESCE(SUM(inv.total_amount), 0.00) AS total_billed_to_date,
    COALESCE(SUM(inv.amount_remaining), 0.00) AS pending_balance
FROM organizations o
JOIN subscriptions s ON o.id = s.organization_id
JOIN pricing_plans p ON s.plan_id = p.id
LEFT JOIN payment_methods pm ON s.default_payment_method_id = pm.id
LEFT JOIN invoices inv ON o.id = inv.organization_id
WHERE o.billing_email = 'billing@nexuspay.io'
GROUP BY o.name, o.billing_email, o.tax_id, p.name, s.status, s.current_period_start, s.current_period_end, s.seat_quantity, pm.card_brand, pm.card_last4;


-- ============================================================================
-- QUERY 3: Dunning & Overdue Invoices Detection
-- Business Goal: Find customers whose auto-charge failed for recovery workflow.
-- ============================================================================
SELECT 
    inv.invoice_number,
    o.name AS organization_name,
    o.billing_email,
    inv.total_amount,
    inv.amount_remaining,
    inv.due_date,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - inv.due_date)) AS days_overdue,
    inv.status AS invoice_status,
    s.status AS subscription_status
FROM invoices inv
JOIN organizations o ON inv.organization_id = o.id
LEFT JOIN subscriptions s ON inv.subscription_id = s.id
WHERE inv.status = 'OPEN' AND inv.due_date < CURRENT_TIMESTAMP
ORDER BY days_overdue DESC;


-- ============================================================================
-- QUERY 4: Metered Usage Billing Calculation (API Consumption Overage)
-- Business Goal: Calculate additional usage charges beyond the base plan limit.
-- ============================================================================
SELECT 
    o.name AS organization_name,
    p.name AS plan_name,
    p.monthly_api_credit_limit AS included_api_limit,
    COALESCE(SUM(u.quantity_used), 0) AS total_api_requests_consumed,
    GREATEST(0, COALESCE(SUM(u.quantity_used), 0) - p.monthly_api_credit_limit) AS billable_overage_units,
    (GREATEST(0, COALESCE(SUM(u.quantity_used), 0) - p.monthly_api_credit_limit) * 0.0002) AS metered_overage_charge_usd
FROM subscriptions s
JOIN organizations o ON s.organization_id = o.id
JOIN pricing_plans p ON s.plan_id = p.id
LEFT JOIN usage_records u ON s.id = u.subscription_id AND u.metric_type = 'API_REQUESTS'
WHERE s.status = 'ACTIVE'
GROUP BY o.name, p.name, p.monthly_api_credit_limit;


-- ============================================================================
-- QUERY 5: Itemized Invoice Breakdown with Tax & Discounts
-- Business Goal: Generate complete receipt view with all itemized charges.
-- ============================================================================
SELECT 
    inv.invoice_number,
    inv.issue_date,
    inv.status,
    o.name AS billed_to,
    ili.description AS line_item_description,
    ili.quantity,
    ili.unit_amount,
    ili.total_amount AS line_total,
    inv.subtotal_amount,
    inv.discount_amount,
    inv.tax_amount,
    inv.total_amount AS final_invoice_total
FROM invoices inv
JOIN organizations o ON inv.organization_id = o.id
JOIN invoice_line_items ili ON inv.id = ili.invoice_id
WHERE inv.invoice_number = 'INV-2026-000101'
ORDER BY ili.created_at ASC;


-- ============================================================================
-- QUERY 6: Payment Gateway Settlement Reconciliation
-- Business Goal: Verify matching settled transactions against issued invoices.
-- ============================================================================
SELECT 
    t.transaction_reference,
    t.idempotency_key,
    o.name AS customer_name,
    inv.invoice_number,
    t.amount AS payment_amount,
    t.status AS transaction_status,
    t.gateway_response_code,
    t.settled_at
FROM transactions t
JOIN organizations o ON t.organization_id = o.id
LEFT JOIN invoices inv ON t.invoice_id = inv.id
ORDER BY t.created_at DESC;


-- ============================================================================
-- QUERY 7: ACID Transaction Example - New Subscription & Immediate Invoicing
-- Business Goal: Safely create a subscription and initial invoice atomically.
-- ============================================================================
BEGIN;

-- 1. Create a dummy organization for demonstration
WITH new_org AS (
    INSERT INTO organizations (name, billing_email, country_code)
    VALUES ('FinFlow Systems Inc.', 'admin@finflow.io', 'US')
    RETURNING id
),
-- 2. Attach a default tokenized card
new_pm AS (
    INSERT INTO payment_methods (organization_id, method_type, card_brand, card_last4, card_exp_month, card_exp_year, is_default)
    SELECT id, 'CREDIT_CARD', 'Visa', '9090', 10, 2028, true FROM new_org
    RETURNING id, organization_id
),
-- 3. Create active subscription
new_sub AS (
    INSERT INTO subscriptions (organization_id, plan_id, default_payment_method_id, status, current_period_start, current_period_end, seat_quantity)
    SELECT 
        new_pm.organization_id, 
        p.id, 
        new_pm.id, 
        'ACTIVE', 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP + INTERVAL '1 month', 
        1
    FROM new_pm, pricing_plans p
    WHERE p.plan_code = 'GROWTH_MO'
    RETURNING id, organization_id
)
-- 4. Generate first invoice atomically
INSERT INTO invoices (invoice_number, organization_id, subscription_id, status, subtotal_amount, tax_amount, total_amount, amount_paid, amount_remaining, due_date, paid_at)
SELECT 
    'INV-2026-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 6, '0'),
    new_sub.organization_id,
    new_sub.id,
    'PAID',
    149.00,
    11.92,
    160.92,
    160.92,
    0.00,
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP
FROM new_sub;

COMMIT;


-- ============================================================================
-- QUERY 8: Churn & Attrition Analysis
-- Business Goal: Count active vs canceled subscriptions and retention percentage.
-- ============================================================================
SELECT 
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_subscriptions,
    COUNT(CASE WHEN status = 'TRIALING' THEN 1 END) AS trialing_subscriptions,
    COUNT(CASE WHEN status = 'PAST_DUE' THEN 1 END) AS past_due_subscriptions,
    COUNT(CASE WHEN status = 'CANCELED' THEN 1 END) AS canceled_subscriptions,
    COUNT(*) AS total_all_time_subscriptions,
    ROUND(
        (COUNT(CASE WHEN status = 'CANCELED' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100.0, 
        2
    ) AS lifetime_churn_rate_percentage
FROM subscriptions;


-- ============================================================================
-- QUERY 9: Security Audit Trail & Webhook Event Logs
-- Business Goal: View chronological audit history for sensitive fintech events.
-- ============================================================================
SELECT 
    a.created_at,
    o.name AS organization_name,
    a.action_type,
    a.actor_email,
    a.ip_address,
    a.payload
FROM audit_logs a
LEFT JOIN organizations o ON a.organization_id = o.id
ORDER BY a.created_at DESC
LIMIT 20;
