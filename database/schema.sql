-- ============================================================================
-- SafeX Fintech - Subscription & Billing Portal Database Architecture
-- Student: Ahmed Iqbal
-- Role: Member 6 - Database Architecture & Data Modeling (PostgreSQL)
-- Database Engine: PostgreSQL 14+ / 15 / 16
-- ============================================================================

-- Enable UUID extension for secure, globally unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUM DEFINITIONS (Domain Constraints & State Machines)
-- ============================================================================

-- Subscription lifecycle state machine
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
        'TRIALING',       -- Free trial active
        'ACTIVE',         -- Paid and active
        'PAST_DUE',       -- Renewal failed, in grace period / dunning
        'CANCELED',       -- Canceled by user or admin, active until period end
        'UNPAID',         -- Dunning attempts exhausted, access locked
        'PAUSED'          -- Temporarily suspended
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Billing frequency intervals
DO $$ BEGIN
    CREATE TYPE billing_interval_enum AS ENUM (
        'MONTHLY',
        'QUARTERLY',
        'YEARLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Financial invoice status
DO $$ BEGIN
    CREATE TYPE invoice_status_enum AS ENUM (
        'DRAFT',          -- Under generation/review
        'OPEN',           -- Finalized and awaiting payment
        'PAID',           -- Successfully settled
        'VOID',           -- Canceled / zeroed out
        'UNCOLLECTIBLE'   -- Written off as bad debt
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction payment settlement status
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'PENDING',        -- In processing
        'SUCCEEDED',      -- Settled in bank/gateway
        'FAILED',         -- Gateway declined or card error
        'REFUNDED',       -- Returned to customer
        'PARTIALLY_REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment method types
DO $$ BEGIN
    CREATE TYPE payment_method_type_enum AS ENUM (
        'CREDIT_CARD',
        'DEBIT_CARD',
        'BANK_TRANSFER_ACH',
        'DIGITAL_WALLET',
        'WIRE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Usage metric types for metered billing
DO $$ BEGIN
    CREATE TYPE metric_type_enum AS ENUM (
        'API_REQUESTS',
        'SEATS_ACTIVE',
        'TRANSACTION_VOLUME_USD',
        'STORAGE_GB'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ============================================================================
-- 2. CORE RELATIONAL TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: organizations (Customers / Tenants)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    legal_business_name VARCHAR(200),
    billing_email VARCHAR(255) NOT NULL UNIQUE,
    tax_id VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    country_code VARCHAR(2) DEFAULT 'US' NOT NULL,
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: pricing_plans (Subscription Tiers & Products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'STARTER_MO', 'PRO_YR'
    name VARCHAR(100) NOT NULL,            -- e.g. 'Starter Tier', 'Pro Enterprise'
    description TEXT,
    billing_interval billing_interval_enum DEFAULT 'MONTHLY' NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    trial_period_days INT DEFAULT 0 CHECK (trial_period_days >= 0),
    max_team_seats INT DEFAULT 1 CHECK (max_team_seats >= 1),
    monthly_api_credit_limit INT DEFAULT 10000 CHECK (monthly_api_credit_limit >= 0),
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: payment_methods (PCI-Compliant Tokenized Customer Cards)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    method_type payment_method_type_enum DEFAULT 'CREDIT_CARD' NOT NULL,
    gateway_customer_id VARCHAR(100),       -- Stripe/Gateway Customer Ref
    gateway_payment_method_id VARCHAR(100), -- Tokenized Card ID
    card_brand VARCHAR(50),                 -- Visa, MasterCard, Amex
    card_last4 VARCHAR(4),                  -- Last 4 digits only (PCI DSS compliant)
    card_exp_month INT CHECK (card_exp_month BETWEEN 1 AND 12),
    card_exp_year INT CHECK (card_exp_year >= 2024),
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: subscriptions (Active Customer Subscriptions Lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE RESTRICT,
    default_payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    status subscription_status_enum DEFAULT 'TRIALING' NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
    canceled_at TIMESTAMPTZ,
    cancellation_reason VARCHAR(255),
    seat_quantity INT DEFAULT 1 NOT NULL CHECK (seat_quantity >= 1),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_period_dates CHECK (current_period_end > current_period_start)
);

-- ----------------------------------------------------------------------------
-- TABLE: invoices (Financial Invoicing Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'INV-2026-000101'
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    status invoice_status_enum DEFAULT 'DRAFT' NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    amount_remaining NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_remaining >= 0),
    issue_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: invoice_line_items (Itemized Invoice Breakdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_amount NUMERIC(12, 2) NOT NULL CHECK (unit_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    proration BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: transactions (Payment Settlement & Gateway Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- Gateway Charge ID (e.g., 'ch_safex_891238')
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,       -- Prevents duplicate payment submissions
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    status payment_status_enum DEFAULT 'PENDING' NOT NULL,
    gateway_response_code VARCHAR(50),
    gateway_error_message TEXT,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: usage_records (Metered Billing & Consumption Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    metric_type metric_type_enum NOT NULL,
    quantity_used BIGINT NOT NULL CHECK (quantity_used >= 0),
    unit_price NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: audit_logs (Fintech Security, Traceability & Compliance Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g. 'SUBSCRIPTION_UPGRADED', 'CARD_CHARGED_SUCCESS'
    actor_email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ============================================================================
-- 3. PERFORMANCE INDEXES (Optimized for Billing & Reporting Queries)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_billing_email ON organizations(billing_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status ON subscriptions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_usage_records_sub_metric ON usage_records(subscription_id, metric_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action ON audit_logs(organization_id, action_type);


-- ============================================================================
-- 4. DATABASE TRIGGERS & PROCEDURES (Automated Timestamps)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_organizations_updated_at ON organizations;
CREATE TRIGGER trg_update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_pricing_plans_updated_at ON pricing_plans;
CREATE TRIGGER trg_update_pricing_plans_updated_at
BEFORE UPDATE ON pricing_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_invoices_updated_at ON invoices;
CREATE TRIGGER trg_update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_transactions_updated_at ON transactions;
CREATE TRIGGER trg_update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 5. ANALYTICAL VIEWS (Key Fintech Business Metrics)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: vw_monthly_recurring_revenue (MRR & ARR by Plan)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_monthly_recurring_revenue AS
SELECT 
    p.name AS plan_name,
    p.billing_interval,
    COUNT(s.id) AS active_subscribers_count,
    SUM(
        CASE 
            WHEN p.billing_interval = 'MONTHLY' THEN p.base_price * s.seat_quantity
            WHEN p.billing_interval = 'QUARTERLY' THEN (p.base_price * s.seat_quantity) / 3.0
            WHEN p.billing_interval = 'YEARLY' THEN (p.base_price * s.seat_quantity) / 12.0
            ELSE 0.00
        END
    ) AS normalized_monthly_mrr,
    SUM(
        CASE 
            WHEN p.billing_interval = 'MONTHLY' THEN (p.base_price * s.seat_quantity) * 12.0
            WHEN p.billing_interval = 'QUARTERLY' THEN (p.base_price * s.seat_quantity) * 4.0
            WHEN p.billing_interval = 'YEARLY' THEN (p.base_price * s.seat_quantity)
            ELSE 0.00
        END
    ) AS normalized_annual_arr
FROM subscriptions s
JOIN pricing_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
GROUP BY p.name, p.billing_interval;

-- ----------------------------------------------------------------------------
-- VIEW: vw_customer_billing_summary (Customer Dashboard Aggregation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_billing_summary AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    o.billing_email,
    s.id AS subscription_id,
    s.status AS subscription_status,
    p.name AS plan_name,
    p.base_price AS plan_price,
    p.billing_interval,
    s.current_period_end AS next_billing_date,
    COALESCE(SUM(inv.total_amount), 0.00) AS lifetime_billed_amount,
    COALESCE(SUM(inv.amount_paid), 0.00) AS lifetime_paid_amount,
    COALESCE(SUM(inv.amount_remaining), 0.00) AS outstanding_balance
FROM organizations o
LEFT JOIN subscriptions s ON o.id = s.organization_id AND s.status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
LEFT JOIN pricing_plans p ON s.plan_id = p.id
LEFT JOIN invoices inv ON o.id = inv.organization_id
GROUP BY o.id, o.name, o.billing_email, s.id, s.status, p.name, p.base_price, p.billing_interval, s.current_period_end;

-- ----------------------------------------------------------------------------
-- VIEW: vw_overdue_invoices (Dunning & Collections Queue)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_overdue_invoices AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    o.name AS organization_name,
    o.billing_email,
    i.total_amount,
    i.amount_remaining,
    i.due_date,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - i.due_date)) AS days_overdue,
    i.status
FROM invoices i
JOIN organizations o ON i.organization_id = o.id
WHERE i.status = 'OPEN' AND i.due_date < CURRENT_TIMESTAMP
ORDER BY i.due_date ASC;
