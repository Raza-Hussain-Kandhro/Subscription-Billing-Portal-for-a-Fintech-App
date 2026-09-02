# SafeX Fintech — Database Architecture Learning & Presentation Guide
**Student:** Ahmed Iqbal  
**Semester:** 7th Semester (BS-SE)  
**Assigned Role:** Member 6 — Database Architecture (MongoDB / PostgreSQL) & Backend DB Assistant (Assisting Muhammad Hassan with Node.js/Express Integration)  
**Project:** Subscription Billing Portal for a Fintech App (Team 2)

---

## 📚 Section 1: Core Concepts Samjhein (Why & How)

### 1. Fintech Billing me PostgreSQL kyu use karte hain? (PostgreSQL vs MongoDB)
- **ACID Properties (Atomicity, Consistency, Isolation, Durability):** Financial systems me paiso ka maamla hota hai. Agar subscription create ho jaye lekin invoice na bane ya payment cut ho jaye lekin status update na ho, to system crash/corrupt ho sakta hai. PostgreSQL garantee deta hai ke ya to poora transaction commit hoga ya rollback hoga (Zero partial failures).
- **Exact Currency Precision (`NUMERIC(12,2)` vs `FLOAT`):** Kabhi bhi financial database me `FLOAT` ya `DOUBLE` use nahi karte kyunki binary floating-point rounding errors paida karta hai (e.g. `0.1 + 0.2 = 0.30000000000000004`). `NUMERIC(12, 2)` hamesha exact 2 decimal digits tak accurate rehta hai ($861.84).
- **Relational Integrity (Foreign Keys):** `subscriptions` table bina valid `organizations` ya `pricing_plans` ke exist nahi kar sakti. `ON DELETE RESTRICT` lagane se koi ghalti se active billing records delete nahi kar sakta.

---

### 2. Idempotency Key kya hoti hai? (`idempotency_key` in `transactions`)
- Jab customer "Pay Now" par double-click kar deta hai ya network disconnect ho jata hai, to duplicate request server par ja sakti hai.
- `idempotency_key` ek unique token hota hai (e.g. `idemp_nexus_aug_2026_01`). PostgreSQL is par `UNIQUE` constraint lagata hai. Agar same key dobara aati hai, to duplicate payment reject ho jati hai aur customer ko do dafa charge hone se bachata hai.

---

### 3. Subscription Lifecycle State Machine
Subscriptions in 6 distinct states me traverse karti hain:
1. **`TRIALING`:** Customer free trial period enjoy kar raha hai (e.g. 14 days).
2. **`ACTIVE`:** Paid subscription active hai aur services accessible hain.
3. **`PAST_DUE`:** Renewal date par auto-debit fail ho gaya, system automated retry/dunning grace period me hai.
4. **`CANCELED`:** Customer ne cancel kiya hai, lekin cycle ke end date tak access open rehti hai (`cancel_at_period_end`).
5. **`UNPAID`:** Multiple payment retries ke baad bhi charge nahi hua, access revoke ho gayi.
6. **`PAUSED`:** Temporary suspension.

---

## 🗄️ Section 2: Relational Tables Deep Dive (Schema Walkthrough)

| Table Name | Purpose / Business Responsibility | Key Fields & Constraints |
| :--- | :--- | :--- |
| **`organizations`** | SaaS/Fintech customers (multi-tenant companies) | `id (UUID PK)`, `billing_email (UNIQUE)`, `tax_id`, `currency` |
| **`pricing_plans`** | Available subscription tiers & packaging | `plan_code (UNIQUE)`, `base_price (NUMERIC)`, `billing_interval (MONTHLY/YEARLY)` |
| **`subscriptions`** | Active recurring contracts & seat counts | `status (ENUM)`, `current_period_start`, `current_period_end`, `seat_quantity` |
| **`invoices`** | Itemized billing statements & VAT/Tax | `invoice_number (UNIQUE)`, `subtotal_amount`, `tax_amount`, `total_amount`, `status` |
| **`invoice_line_items`** | Granular breakdown per line on invoice | `invoice_id (FK CASCADE)`, `unit_amount`, `quantity`, `proration` |
| **`payment_methods`** | PCI-DSS compliant tokenized card records | `gateway_customer_id`, `card_brand`, `card_last4` *(Never store CVV/Full PAN)* |
| **`transactions`** | Immutable payment settlement ledger | `transaction_reference`, `idempotency_key (UNIQUE)`, `status (SUCCEEDED/FAILED)` |
| **`usage_records`** | Metered billing (API consumption & volume) | `subscription_id (FK)`, `metric_type`, `quantity_used`, `recorded_at` |
| **`audit_logs`** | Security, compliance & webhook audit trail | `action_type`, `actor_email`, `ip_address`, `payload (JSONB)` |

---

## 🎙️ Section 3: 5 to 10 Minutes Video Recording Presentation Script
*(Jab aap laptop screen record kar rahe hon, is script ko step-by-step follow karein)*

```
================================================================================
TIME        | WHAT TO SHOW ON SCREEN               | WHAT TO SPEAK (URDU / ENGLISH)
================================================================================

0:00 - 1:00 | SafeX Project Folder & IDE           | "Assalam-o-Alaikum / Hello everyone.
            | (Show schema.sql & README)           | My name is Ahmed Iqbal,
                                                   | 7th Semester Software Engineering student.
                                                   | In our group project 'Subscription Billing Portal
                                                   | for a Fintech App (Team 2)', my assigned role is
                                                   | Member 6 — Database Architecture & Data Modeling (PostgreSQL/MongoDB),
                                                   | and assisting Muhammad Hassan in the Node.js/Express Backend Data Layer."

1:00 - 2:30 | Open schema.sql & highlight:         | "Fintech aur Subscription Billing platforms me
            | - NUMERIC(12,2)                      | data accuracy aur strict ACID compliance sabse
            | - UUID extension                     | critical hoti hai. Isliye humne PostgreSQL select kiya.
            | - ENUM definitions                   | Humne currency ke liye FLOAT ke bajaye NUMERIC(12,2)
            | - Foreign Keys with ON DELETE RESTRICT| use kiya taake koi rounding error na aaye.
                                                   | Humne 5 Custom ENUMs define kiye hain jo
                                                   | subscription lifecycle (Active, Past_Due, Canceled)
                                                   | aur invoice states ko enforce karte hain."

2:30 - 4:30 | Open viewer/index.html (ERD Tab)     | "Schema design me 8 primary tables hain:
            | Point out:                           | 1. Organizations: Multi-tenant client companies.
            | 1. organizations                     | 2. Pricing Plans: Monthly aur Annual tiers.
            | 2. subscriptions                     | 3. Subscriptions: Recurring contracts aur seats.
            | 3. invoices & line items             | 4. Invoices & Line Items: Automated tax aur itemized charges.
            | 4. transactions (idempotency_key)    | 5. Transactions: PCI DSS tokenized ledger with idempotency keys
            | 5. payment_methods                   |    jo double billing prevent karti hai."

4:30 - 7:00 | Open viewer/index.html               | "Ab main aapko live analytical queries execute karke
            | (Interactive Query Playground Tab)   | dikhata hoon:
            | - Click Query 1 (MRR & ARR)          | - Pehli query hamara Monthly Recurring Revenue (MRR)
            | - Click Query 3 (Overdue Invoices)   |   calculate karti hai by normalizing monthly & annual plans.
            | - Click Query 4 (Metered Usage)      | - Doosri query dunning process ke liye overdue invoices
                                                   |   aur failed charges filter karti hai.
                                                   | - Teesri query base plan limit ke upar API usage overage
                                                   |   charges calculate karti hai."

7:00 - 8:30 | Show Table Browser Tab & Audit Logs  | "SafeX portal me security aur compliance ke liye
                                                   | humne Audit Logs table me har billing event, plan upgrade
                                                   | aur payment webhook ko JSONB format me store kiya hai.
                                                   | Sath hi team collaboration ke liye humne NoSQL
                                                   | MongoDB Mongoose models bhi provide kiye hain."

8:30 - 9:30 | Show GitHub README & wrap up         | "Maine complete SQL DDL, seed data scripts, queries,
                                                   | aur interactive test viewer GitHub par upload kar diya hai.
                                                   | Thank you very much!"
================================================================================
```

---

## 🛠️ Section 4: Testing & Running Instructions

### Option A: Open the Interactive Visual Explorer (Instant & Zero Setup)
1. Navigate to the project folder: `viewer/`
2. Double click `index.html` (opens instantly in Chrome / Edge / Brave).
3. Browse live tables, click **Execute Query** on any of the 7 Fintech queries, and view the ERD diagram and video teleprompter.

### Option B: Run in Local PostgreSQL (pgAdmin / psql CLI)
```bash
# 1. Create database in PostgreSQL
createdb safex_billing_db

# 2. Run Schema & Tables
psql -d safex_billing_db -f database/schema.sql

# 3. Populate Seed Data
psql -d safex_billing_db -f database/seed.sql

# 4. Execute Queries
psql -d safex_billing_db -f database/queries.sql
```
