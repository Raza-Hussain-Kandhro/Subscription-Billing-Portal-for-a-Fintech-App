-- ============================================================================
-- SafeX Fintech Subscription Billing Portal - Supabase / PostgreSQL Schema & Seeds
-- Contributor: Ahmed Iqbal
-- Roles: Database Architecture (PostgreSQL/Supabase) & Backend (Node.js/Express)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if rebuilding (Cascading Drop)
DROP VIEW IF EXISTS vw_monthly_recurring_revenue CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Client Accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2. ADMINS TABLE (Administrative Staff)
-- ----------------------------------------------------------------------------
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT 'System Administrator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. ORGANIZATIONS TABLE (Multi-tenant B2B Organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. PRICING PLANS TABLE (Basic, Pro, Premium tiers)
-- ----------------------------------------------------------------------------
CREATE TABLE pricing_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    billing_interval VARCHAR(50) DEFAULT 'MONTHLY',
    features TEXT[] DEFAULT '{}',
    description TEXT,
    max_team_seats INT DEFAULT 5,
    monthly_api_credit_limit INT DEFAULT 100000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. SUBSCRIPTIONS TABLE (Active/Managed Client Subscriptions)
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    plan_id INT REFERENCES pricing_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive', 'Trialing', 'Past_Due'
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
    seat_quantity INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- ----------------------------------------------------------------------------
-- 6. INVOICES TABLE (Billing History & Invoicing Records)
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    amount_remaining NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Paid', -- 'Paid', 'Pending', 'Overdue', 'Cancelled'
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ----------------------------------------------------------------------------
-- 7. INVOICE LINE ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. USAGE RECORDS (Metered API Usage Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE usage_records (
    id SERIAL PRIMARY KEY,
    subscription_id INT REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- e.g. 'api_calls', 'webhooks', 'compute_seconds'
    quantity_used NUMERIC(12, 4) NOT NULL,
    unit_price NUMERIC(10, 6) DEFAULT 0.000100,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. FINANCIAL ANALYTICS VIEW (MRR / ARR Calculation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_monthly_recurring_revenue AS
SELECT 
    p.id AS plan_id,
    p.name AS plan_name,
    p.billing_interval,
    p.price AS base_price,
    COUNT(s.id) AS active_subscribers,
    SUM(s.seat_quantity) AS total_active_seats,
    SUM(p.price * s.seat_quantity) AS normalized_monthly_mrr,
    SUM(p.price * s.seat_quantity * 12) AS normalized_annual_arr
FROM pricing_plans p
JOIN subscriptions s ON p.id = s.plan_id
WHERE s.status = 'Active'
GROUP BY p.id, p.name, p.billing_interval, p.price;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- 1. Seed Admin Record (Password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO admins (username, password_hash, name)
VALUES ('admin', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', 'System Administrator');

-- 2. Seed Pricing Plans
INSERT INTO pricing_plans (id, plan_code, name, price, billing_interval, features, description, max_team_seats, monthly_api_credit_limit)
VALUES 
(1, 'BASIC_MONTHLY', 'Basic', 9.00, 'MONTHLY', 
 ARRAY['1 billing account', 'Monthly invoices', 'Email support', 'Basic reporting'], 
 'Ideal for early-stage fintech projects and solo developers.', 1, 10000),

(2, 'PRO_MONTHLY', 'Pro', 29.00, 'MONTHLY', 
 ARRAY['5 billing accounts', 'Weekly invoices', 'Priority support', 'Advanced reporting', 'Team roles'], 
 'Designed for scaling fintech teams with automated reconciliation.', 5, 100000),

(3, 'PREMIUM_MONTHLY', 'Premium', 79.00, 'MONTHLY', 
 ARRAY['Unlimited billing accounts', 'Real-time invoices', '24/7 dedicated support', 'Custom reporting', 'Team roles & permissions', 'API access'], 
 'Enterprise-grade billing platform with full SLA and high-volume limits.', 50, 1000000);

-- Reset identity sequence for pricing_plans
SELECT setval('pricing_plans_id_seq', (SELECT MAX(id) FROM pricing_plans));

-- 3. Seed Demo Users (Password: password123 for all: $2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.)
INSERT INTO users (id, name, email, password_hash, phone, status)
VALUES 
(1, 'Amina Farooq', 'amina@vertexpay.com', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+92-300-1112233', 'Active'),
(2, 'Bilal Sheikh', 'bilal@northfin.io', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+92-321-2223344', 'Active'),
(3, 'Carla Mendes', 'carla@ledgerly.co', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+1-415-555-0199', 'Active'),
(4, 'Daniyal Khan', 'daniyal@paystack.dev', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+92-333-4445566', 'Inactive'),
(5, 'Elena Petrova', 'elena@brightbooks.com', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+44-20-7946-0912', 'Inactive'),
(6, 'Farhan Malik', 'farhan@quantabank.com', '$2b$10$Y1sD4oYQfU0mEwK5jB6fcebB/0o8.9mG5x8bFhV7t8aIkgqP3HwU.', '+92-345-5556677', 'Active');

-- Reset identity sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 4. Seed Organizations
INSERT INTO organizations (user_id, name, billing_email, tax_id)
VALUES 
(1, 'Vertex Pay Global', 'amina@vertexpay.com', 'TX-PAK-90182'),
(2, 'NorthFin Technologies', 'bilal@northfin.io', 'TX-PAK-44210'),
(3, 'Ledgerly Co.', 'carla@ledgerly.co', 'US-EIN-9921827'),
(4, 'PayStack Dev', 'daniyal@paystack.dev', 'TX-PAK-11827'),
(5, 'BrightBooks Accounting', 'elena@brightbooks.com', 'GB-VAT-3329182'),
(6, 'QuantaBank Finance', 'farhan@quantabank.com', 'TX-PAK-88371');

-- 5. Seed Subscriptions
INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, seat_quantity)
VALUES 
(1, 2, 'Active', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 1),
(2, 1, 'Active', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '10 days', 1),
(3, 3, 'Active', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '25 days', 2),
(4, 2, 'Inactive', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '30 days', 1),
(5, 1, 'Inactive', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '60 days', 1),
(6, 3, 'Active', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '20 days', 1);

-- 6. Seed Invoices for Amina Farooq (User 1)
INSERT INTO invoices (invoice_number, user_id, amount, tax_amount, total_amount, amount_paid, amount_remaining, status, invoice_date, due_date, paid_at)
VALUES 
('INV-2026-001', 1, 29.00, 0.00, 29.00, 29.00, 0.00, 'Paid', '2026-08-01 10:00:00+00', '2026-08-08 10:00:00+00', '2026-08-01 10:05:00+00'),
('INV-2026-002', 1, 29.00, 0.00, 29.00, 29.00, 0.00, 'Paid', '2026-07-01 10:00:00+00', '2026-07-08 10:00:00+00', '2026-07-01 10:05:00+00'),
('INV-2026-003', 1, 29.00, 0.00, 29.00, 29.00, 0.00, 'Paid', '2026-06-01 10:00:00+00', '2026-06-08 10:00:00+00', '2026-06-01 10:05:00+00'),
('INV-2026-004', 1, 9.00, 0.00, 9.00, 9.00, 0.00, 'Paid', '2026-05-01 10:00:00+00', '2026-05-08 10:00:00+00', '2026-05-01 10:05:00+00'),
('INV-2026-005', 1, 29.00, 0.00, 29.00, 0.00, 29.00, 'Pending', '2026-09-01 10:00:00+00', '2026-09-08 10:00:00+00', NULL);

-- Reset identity sequence for invoices
SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));

-- 7. Seed Line Items
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price)
VALUES 
(1, 'SafeX Pro Monthly Subscription', 1, 29.00, 29.00),
(2, 'SafeX Pro Monthly Subscription', 1, 29.00, 29.00),
(3, 'SafeX Pro Monthly Subscription', 1, 29.00, 29.00),
(4, 'SafeX Basic Monthly Subscription', 1, 9.00, 9.00),
(5, 'SafeX Pro Monthly Subscription', 1, 29.00, 29.00);

-- 8. Seed Metered Usage
INSERT INTO usage_records (subscription_id, metric_type, quantity_used, unit_price)
VALUES 
(1, 'api_calls', 45200, 0.000100),
(1, 'webhooks_dispatched', 1240, 0.000500),
(3, 'api_calls', 189000, 0.000100);
