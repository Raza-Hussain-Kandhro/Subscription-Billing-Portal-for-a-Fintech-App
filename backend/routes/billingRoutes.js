/**
 * SafeX Fintech - REST API Routes for Subscription & Billing
 * Connects Frontend / Client requests to PostgreSQL Database Layer
 */

const express = require('express');
const router = express.Router();
const billingCtrl = require('../controllers/billingController');

// 1. Pricing Plans
router.get('/plans', billingCtrl.getPlans);

// 2. Customer 360 Overview
router.get('/customers/:email/overview', billingCtrl.getCustomerOverview);

// 3. Subscriptions (Atomic ACID creation)
router.post('/subscriptions', billingCtrl.createSubscription);

// 4. Invoices
router.get('/invoices', billingCtrl.getInvoices);

// 5. Financial Analytics (MRR / ARR)
router.get('/analytics/mrr', billingCtrl.getMrrAnalytics);

// 6. Metered Billing Usage Log
router.post('/usage/record', billingCtrl.recordUsage);

module.exports = router;
