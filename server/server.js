/**
 * SafeX Fintech - Subscription Billing Portal Backend Server
 * Lead Developer: Ahmed Iqbal
 * Role: Database Architecture (PostgreSQL/Supabase) & Backend (Node.js/Express)
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usageRoutes = require('./routes/usageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Frontend React Client & Local Development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root Health & System Status Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        app: 'SafeX Fintech Subscription Billing Portal API',
        status: 'Online',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        developer: 'Ahmed Iqbal',
        roles: ['Database Architecture (PostgreSQL / Supabase)', 'Backend REST API (Node.js / Express)'],
        endpoints: {
            auth: ['POST /api/signup', 'POST /api/signin', 'POST /api/admin/login'],
            plans: ['GET /api/plans', 'POST /api/plans', 'PUT /api/plans/:id', 'DELETE /api/plans/:id'],
            subscriptions: ['GET /api/subscriptions/:userId', 'PUT /api/subscriptions/:userId'],
            invoices: ['GET /api/invoices/:userId', 'GET /api/invoices'],
            admin: ['GET /api/admin/clients', 'PATCH /api/admin/clients/:id/status', 'GET /api/admin/stats'],
            metered_usage: ['POST /api/usage/record', 'GET /api/analytics/mrr']
        }
    });
});

// Mount Routes with /api prefix (Standard REST)
app.use('/api', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/analytics', usageRoutes);

// Direct Mount Fallbacks for SRS route compatibility
app.use('/plans', planRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/', authRoutes);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack || err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error: ' + err.message });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('===============================================================');
        console.log(`🚀 SafeX Billing Server listening on http://localhost:${PORT}`);
        console.log(`👤 Architecture & Backend by: Ahmed Iqbal`);
        console.log(`⚡ Supabase PostgreSQL Connection Pool Active`);
        console.log('===============================================================');
    });
}

module.exports = app;
