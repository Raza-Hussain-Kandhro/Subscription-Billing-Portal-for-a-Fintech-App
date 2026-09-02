-- ============================================================================
-- SafeX Fintech - Realistic Seed Data for Subscription & Billing Portal
-- Student: Ahmed Iqbal
-- Role: Member 6 - Database Architecture & Data Modeling (PostgreSQL)
-- ============================================================================

-- Clean existing data in reverse order of foreign key dependencies
TRUNCATE TABLE audit_logs, usage_records, transactions, invoice_line_items, invoices, subscriptions, payment_methods, pricing_plans, organizations CASCADE;

-- ============================================================================
-- 1. SEED ORGANIZATIONS (Fintech Clients / SaaS Customers)
-- ============================================================================

INSERT INTO organizations (id, name, legal_business_name, billing_email, tax_id, currency, country_code, address_line1, city, postal_code, is_active)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nexus Digital Pay', 'Nexus Digital Payments LLC', 'billing@nexuspay.io', 'US-TAX-88912', 'USD', 'US', '100 Financial Way', 'San Francisco', '94105', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'PayScale Global', 'PayScale Global Technologies Inc.', 'accounts@payscaleglobal.com', 'GB-VAT-44129', 'USD', 'GB', '24 Canary Wharf', 'London', 'E14 5AB', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Apex Ledger Labs', 'Apex Distributed Ledger Ltd.', 'finance@apexledger.co', 'US-TAX-10294', 'USD', 'US', '452 Wall Street', 'New York', '10005', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Quantum Capital', 'Quantum Capital Management FZE', 'billing@quantumcap.ae', 'AE-TRN-77821', 'USD', 'AE', 'DIFC Gate Tower 4', 'Dubai', '00000', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'CloudBank Neo', 'CloudBank Technologies AG', 'accounting@cloudbank.ch', 'CH-UID-55421', 'USD', 'CH', '12 Bahnhofstrasse', 'Zurich', '8001', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'ByteFlow Fintech', 'ByteFlow Open Banking Co.', 'invoicing@byteflow.dev', 'US-TAX-33921', 'USD', 'US', '78 Silicon Blvd', 'Austin', '78701', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Veloce Remit', 'Veloce International Remittance', 'billing@velocemit.com', 'SG-UEN-99120', 'USD', 'SG', '1 Marina Boulevard', 'Singapore', '018989', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Alpha Hedge Tech', 'Alpha Quantitative Analytics Ltd.', 'ops@alphahedge.io', 'US-TAX-55102', 'USD', 'US', '300 N Michigan Ave', 'Chicago', '60601', true);


-- ============================================================================
-- 2. SEED PRICING PLANS (Subscription Tiers)
-- ============================================================================

INSERT INTO pricing_plans (id, plan_code, name, description, billing_interval, base_price, currency, trial_period_days, max_team_seats, monthly_api_credit_limit, is_public, is_active)
VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'STARTER_MO', 'Starter Tier (Monthly)', 'For early-stage startups and sandbox fintech developers.', 'MONTHLY', 49.00, 'USD', 14, 3, 25000, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'GROWTH_MO', 'Growth Tier (Monthly)', 'For scaling fintechs requiring advanced automated reconciliation.', 'MONTHLY', 149.00, 'USD', 14, 10, 100000, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'PRO_MO', 'Professional Tier (Monthly)', 'Full-suite subscription billing, multi-currency routing & webhooks.', 'MONTHLY', 399.00, 'USD', 7, 30, 500000, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'ENTERPRISE_YR', 'Enterprise Tier (Annual)', 'Dedicated SLA, custom ledger integrations, unlimited API throughput.', 'YEARLY', 4500.00, 'USD', 0, 100, 5000000, true, true);


-- ============================================================================
-- 3. SEED PAYMENT METHODS (PCI DSS Tokenized Cards)
-- ============================================================================

INSERT INTO payment_methods (id, organization_id, method_type, gateway_customer_id, gateway_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, is_active)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CREDIT_CARD', 'cus_safex_nexus_01', 'pm_card_visa_4242', 'Visa', '4242', 12, 2028, true, true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CREDIT_CARD', 'cus_safex_payscale_02', 'pm_card_mc_5555', 'MasterCard', '5555', 8, 2027, true, true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'CREDIT_CARD', 'cus_safex_apex_03', 'pm_card_amex_0005', 'American Express', '0005', 11, 2029, true, true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'BANK_TRANSFER_ACH', 'cus_safex_quantum_04', 'pm_ach_chase_9912', 'Bank of America ACH', '9912', NULL, NULL, true, true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c35', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'CREDIT_CARD', 'cus_safex_cloudbank_05', 'pm_card_visa_1881', 'Visa Corporate', '1881', 5, 2028, true, true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'CREDIT_CARD', 'cus_safex_byteflow_06', 'pm_card_mc_4444', 'MasterCard', '4444', 3, 2026, true, true);


-- ============================================================================
-- 4. SEED SUBSCRIPTIONS (Lifecycle States)
-- ============================================================================

INSERT INTO subscriptions (id, organization_id, plan_id, default_payment_method_id, status, current_period_start, current_period_end, trial_start, trial_end, seat_quantity)
VALUES
    -- Active Pro Monthly
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'ACTIVE', '2026-08-01 00:00:00+00', '2026-09-01 00:00:00+00', NULL, NULL, 2),
    -- Active Growth Monthly
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'ACTIVE', '2026-08-15 00:00:00+00', '2026-09-15 00:00:00+00', NULL, NULL, 1),
    -- Active Enterprise Yearly
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'ACTIVE', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', NULL, NULL, 1),
    -- Trialing Starter
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34', 'TRIALING', '2026-08-20 00:00:00+00', '2026-09-03 00:00:00+00', '2026-08-20 00:00:00+00', '2026-09-03 00:00:00+00', 1),
    -- Past Due (Failed auto-renewal)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36', 'PAST_DUE', '2026-08-10 00:00:00+00', '2026-09-10 00:00:00+00', NULL, NULL, 1),
    -- Canceled
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', NULL, 'CANCELED', '2026-07-01 00:00:00+00', '2026-08-01 00:00:00+00', NULL, NULL, 1);


-- ============================================================================
-- 5. SEED INVOICES & LINE ITEMS
-- ============================================================================

-- Invoice 1 (Paid - Pro Tier + 1 extra seat)
INSERT INTO invoices (id, invoice_number, organization_id, subscription_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount, amount_paid, amount_remaining, issue_date, due_date, paid_at, billing_period_start, billing_period_end)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e51', 'INV-2026-000101', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'PAID', 'USD', 798.00, 0.00, 63.84, 861.84, 861.84, 0.00, '2026-08-01 08:00:00+00', '2026-08-05 00:00:00+00', '2026-08-01 08:02:15+00', '2026-08-01 00:00:00+00', '2026-09-01 00:00:00+00');

INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, total_amount, proration)
VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f61', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e51', 'Professional Tier Subscription (2 Seats @ $399.00/mo)', 2, 399.00, 798.00, false);

-- Invoice 2 (Paid - Growth Tier)
INSERT INTO invoices (id, invoice_number, organization_id, subscription_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount, amount_paid, amount_remaining, issue_date, due_date, paid_at, billing_period_start, billing_period_end)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e52', 'INV-2026-000102', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'PAID', 'USD', 149.00, 14.90, 10.73, 144.83, 144.83, 0.00, '2026-08-15 09:00:00+00', '2026-08-20 00:00:00+00', '2026-08-15 09:01:45+00', '2026-08-15 00:00:00+00', '2026-09-15 00:00:00+00');

INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, total_amount, proration)
VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f62', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e52', 'Growth Tier Plan - Monthly', 1, 149.00, 149.00, false);

-- Invoice 3 (Paid - Enterprise Annual)
INSERT INTO invoices (id, invoice_number, organization_id, subscription_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount, amount_paid, amount_remaining, issue_date, due_date, paid_at, billing_period_start, billing_period_end)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e53', 'INV-2026-000103', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'PAID', 'USD', 4500.00, 500.00, 320.00, 4320.00, 4320.00, 0.00, '2026-01-01 00:00:00+00', '2026-01-15 00:00:00+00', '2026-01-02 11:30:00+00', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00');

INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, total_amount, proration)
VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f63', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e53', 'Enterprise Tier Annual Package with Dedicated SLA', 1, 4500.00, 4500.00, false);

-- Invoice 4 (OPEN / Overdue - Past Due account)
INSERT INTO invoices (id, invoice_number, organization_id, subscription_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount, amount_paid, amount_remaining, issue_date, due_date, paid_at, billing_period_start, billing_period_end)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e54', 'INV-2026-000104', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'OPEN', 'USD', 149.00, 0.00, 11.92, 160.92, 0.00, 160.92, '2026-08-10 00:00:00+00', '2026-08-15 00:00:00+00', NULL, '2026-08-10 00:00:00+00', '2026-09-10 00:00:00+00');

INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, total_amount, proration)
VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f64', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e54', 'Growth Tier Plan Renewal (Attempt Failed)', 1, 149.00, 149.00, false);


-- ============================================================================
-- 6. SEED TRANSACTIONS (Payment Gateway Settlement Ledger)
-- ============================================================================

INSERT INTO transactions (id, transaction_reference, idempotency_key, organization_id, invoice_id, payment_method_id, amount, currency, status, gateway_response_code, settled_at)
VALUES
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380111', 'txn_safex_8829101', 'idemp_nexus_aug_2026_01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e51', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 861.84, 'USD', 'SUCCEEDED', 'RESP_200_AUTH_SUCCESS', '2026-08-01 08:02:15+00'),
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380112', 'txn_safex_8829102', 'idemp_payscale_aug_2026_01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e52', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 144.83, 'USD', 'SUCCEEDED', 'RESP_200_AUTH_SUCCESS', '2026-08-15 09:01:45+00'),
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380113', 'txn_safex_8829103', 'idemp_apex_annual_2026', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e53', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 4320.00, 'USD', 'SUCCEEDED', 'RESP_200_AUTH_SUCCESS', '2026-01-02 11:30:00+00'),
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380114', 'txn_safex_8829104', 'idemp_byteflow_fail_01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e54', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36', 160.92, 'USD', 'FAILED', 'ERR_CARD_EXPIRED_OR_DECLINED', NULL);


-- ============================================================================
-- 7. SEED USAGE RECORDS (Metered API & Cloud Volume Consumption)
-- ============================================================================

INSERT INTO usage_records (id, subscription_id, metric_type, quantity_used, unit_price, recorded_at)
VALUES
    (uuid_generate_v4(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'API_REQUESTS', 342190, 0.0001, '2026-08-25 12:00:00+00'),
    (uuid_generate_v4(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'TRANSACTION_VOLUME_USD', 850000, 0.0005, '2026-08-25 12:00:00+00'),
    (uuid_generate_v4(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'API_REQUESTS', 84120, 0.0001, '2026-08-26 14:30:00+00'),
    (uuid_generate_v4(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'API_REQUESTS', 2894000, 0.00005, '2026-08-28 09:15:00+00');


-- ============================================================================
-- 8. SEED AUDIT LOGS (Security & Compliance Trail)
-- ============================================================================

INSERT INTO audit_logs (id, organization_id, action_type, actor_email, ip_address, payload, created_at)
VALUES
    (uuid_generate_v4(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PLAN_UPGRADE_INITIATED', 'billing@nexuspay.io', '192.168.1.45', '{"from_plan": "GROWTH_MO", "to_plan": "PRO_MO", "seats": 2}'::jsonb, '2026-08-01 07:55:10+00'),
    (uuid_generate_v4(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'INVOICE_GENERATED', 'system.billing@safex.internal', '10.0.0.1', '{"invoice_id": "INV-2026-000101", "amount": 861.84}'::jsonb, '2026-08-01 08:00:00+00'),
    (uuid_generate_v4(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PAYMENT_SETTLED', 'gateway.webhook@stripe.com', '54.187.21.9', '{"txn_id": "txn_safex_8829101", "status": "SUCCEEDED"}'::jsonb, '2026-08-01 08:02:15+00'),
    (uuid_generate_v4(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'PAYMENT_FAILED_DUNNING_START', 'system.billing@safex.internal', '10.0.0.1', '{"invoice_id": "INV-2026-000104", "attempt": 1, "next_retry": "2026-09-02"}'::jsonb, '2026-08-10 00:05:00+00');
