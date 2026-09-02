# Subscription Billing Portal — Frontend (client/)

React frontend for the Subscription Billing Portal, a fintech demo app
(see SRS_Subscription_Billing_Portal.docx). This delivery covers the
**client/** folder only, built to the structure and ownership map in
Project_Structure.docx — `server/` and `database/` are out of scope here.

## Run it

```bash
cd client
npm install
npm start
```

Opens at `http://localhost:3000`.

**Demo login** (no backend required — everything runs on mock data in
`src/mockData.js` and the `src/api/*.js` stubs):
- **Client:** any email + a password of 8+ characters
- **Admin:** username `admin`, password `admin123`

## What's implemented

| SRS section | Component/Page |
| --- | --- |
| 3.1.1 Registration | `pages/Signup.jsx` |
| 3.1.2 / 3.2.1 Login (client + admin) | `pages/Signin.jsx` |
| 3.1.3 Client Dashboard | `pages/ClientDashboard.jsx` |
| 3.1.4 View & Change Plan | `pages/Plans.jsx` + `components/PlanCard.jsx` |
| 3.1.5 Billing History | `pages/BillingHistory.jsx` + `components/InvoiceTable.jsx` |
| 3.1.6 Logout | `components/Sidebar.jsx` / `components/Navbar.jsx` |
| 3.2.2 Manage Clients | `pages/AdminDashboard.jsx` (Clients tab) |
| 3.2.3 Manage Plans | `pages/AdminDashboard.jsx` (Plans tab) |
| 3.2.4 Admin Overview | `pages/AdminDashboard.jsx` (Overview tab) |

## Connecting the real backend

Every function in `src/api/auth.js`, `src/api/plans.js`, and
`src/api/invoices.js` has the real `fetch(...)` call written and
commented out directly above the mock implementation it currently
returns — matching the routes in `server/routes/*.js` from the SRS
(`/signup`, `/signin`, `/admin/login`, `/plans`, `/invoices/:userId`,
etc.). Uncomment the fetch block and delete the mock block once the
Express/PostgreSQL backend is running; no component code needs to
change since pages only ever call the functions in `src/api/`.

## Design system

- Navy `#1E3A8A` for brand/primary actions, light gray `#F9FAFB`
  background, green `#10B981` for Active/Paid, red `#EF4444` for
  Inactive/Pending.
- Inter typeface, 8px radius on inputs/buttons, 12px on cards, subtle
  shadows, no heavy borders.
- Sidebar + top navbar shell on desktop; sidebar collapses into a
  slide-out drawer under 900px.

## Notes for the team (per the Ownership Map)

- `pages/`, `components/` — Muhammad Rizwan
- `api/` — Abdul Rehman
- `styles/` — Raza Hussain, Sajid Ali
- Auth flow logic mirrors `authController.js` behavior (validation
  inline, no JWT/sessions) so it drops in cleanly once Hassan Abbas's
  routes are live.
