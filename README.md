# SafeX Fintech — Subscription Billing Portal

[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2F%20PostgreSQL%2015%2B-3ECF8E.svg?logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018-blue.svg?logo=react)](https://reactjs.org/)
[![ACID Compliant](https://img.shields.io/badge/Security-ACID%20%26%20PCI%20DSS%20Ready-emerald.svg)]()
[![Status](https://img.shields.io/badge/Status-Completed-success.svg)]()

> **Project:** Subscription Billing Portal for a Fintech App 
> **Lead Developer (Frontend & Functionality):** Raza Hussain
> **Lead Developer (DB & Backend):** Ahmed Iqbal  
> **Responsibilities:**
> - 🗄️ **Database Architecture & Data Modeling:** PostgreSQL on Supabase Cloud
> - ⚡ **Backend Engineering:** Node.js / Express REST API, ACID Transactions, Metered Usage & Financial MRR Engine
> - 💻 **Full-Stack Integration:** Connecting Frontend (`client/`) to Backend & Database

---

## 🏛️ System Architecture

```
Subscription-Billing-Portal/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── api/                # API wrappers (auth.js, plans.js, invoices.js)
│   │   ├── components/         # Navbar, Sidebar, PlanCard, InvoiceTable
│   │   ├── pages/              # Signin, Signup, ClientDashboard, Plans, AdminDashboard
│   │   └── styles/             # Fintech design system CSS
│   └── package.json
│
├── server/                     # Node.js + Express REST API Backend
│   ├── config/                 # PostgreSQL / Supabase pool configuration (db.js)
│   ├── controllers/            # auth, plans, subscriptions, invoices, admin, usage
│   ├── routes/                 # Express API routes
│   ├── scripts/                # testConnection.js
│   └── server.js               # Entry point
│
├── database/                   # Database Schemas & Migrations
│   ├── supabase_schema_and_seed.sql # 1-Click Supabase Schema & Seed Script
│   ├── schema.sql              # Standard PostgreSQL Schema
│   └── queries.sql             # Financial & analytical billing queries
│
├── .env.example                # Environment variables template
├── package.json                # Root project configuration & scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v16+)
- A [Supabase](https://supabase.com/) Account (Free tier) or Local PostgreSQL

### 2. Database Setup (Supabase in 1-Click)
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)** and create a new project.
2. Go to the **SQL Editor** tab on the left sidebar.
3. Open [`database/supabase_schema_and_seed.sql`](database/supabase_schema_and_seed.sql), copy the entire SQL script, paste it into the Supabase SQL Editor, and click **Run**.
4. Go to **Project Settings** -> **Database** -> **Connection String**, choose **URI (Transaction Pooler or Direct)** and copy your connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 3. Backend Setup
1. In the root directory, create a `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   REACT_APP_API_BASE=http://localhost:5000/api
   ```
2. Test your database connection:
   ```bash
   npm run test:db
   ```
3. Start the Backend server:
   ```bash
   npm run dev
   ```
   *Server runs at `http://localhost:5000` with Supabase pool connected.*

### 4. Frontend Client Setup
1. In a separate terminal, install and run the React client:
   ```bash
   cd client
   npm install
   npm start
   ```
   *Client runs at `http://localhost:3000`.*

---

## 🔑 Demo Login Credentials

| Role | Identifier / Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full admin dashboard, client management, plan creation & stats |
| **Client** | `amina@vertexpay.com` | `password123` | Pro Plan active, billing history, upgrade/downgrade |
| **Client** | `bilal@northfin.io` | `password123` | Basic Plan active |
| **Client** | `carla@ledgerly.co` | `password123` | Premium Plan active |
| **New User** | Any valid signup | 6+ chars | Auto-generates organization & default plan subscription |

---

## 📡 REST API Specification

### Authentication
- `POST /api/signup` — Register new client, create default organization and initial subscription.
- `POST /api/signin` — Authenticate client credentials with bcrypt verification.
- `POST /api/admin/login` — Authenticate admin account.

### Pricing Plans & Management
- `GET /api/plans` — Fetch all active subscription tiers (Basic $9, Pro $29, Premium $79).
- `POST /api/plans` — Admin: create a new subscription plan.
- `PUT /api/plans/:id` — Admin: update an existing plan.
- `DELETE /api/plans/:id` — Admin: soft-delete a plan.

### Subscriptions & Billing
- `GET /api/subscriptions/:userId` — Fetch client's current plan, status, next renewal date, and amount due.
- `PUT /api/subscriptions/:userId` — Change/upgrade plan atomically with ACID transaction and invoice generation.
- `GET /api/invoices/:userId` — Fetch itemized billing history for a client.
- `GET /api/invoices` — Admin: get all invoices.

### Admin & Analytics
- `GET /api/admin/clients` — Client list with plan and active/inactive status.
- `PATCH /api/admin/clients/:id/status` — Deactivate or activate a client account.
- `GET /api/admin/stats` — Portal metrics (Total clients, active subscriptions, total plans, MRR).
- `POST /api/usage/record` — Log metered API usage events.
- `GET /api/analytics/mrr` — Financial Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR) breakdown.

---

## 👨‍💻 Author & Contributions
- **Raza Hussain**-Leader (7th Semester)
- **Ahmed Iqbal**  (7th Semester)
- **Abdul Rehman**  (Graduated)
- **Sajid Ali**  (Graduated)
- **Muhammad Hassan abbas**  (8th Semester)
- **Syed Qazi Burhan**  (5th Semester)


  
- -**SafeX Internship**—-Group 60
  


