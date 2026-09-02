/**
 * SafeX Fintech - Supabase / PostgreSQL Connection Pool
 * Developer: Ahmed Iqbal
 * Role: Database Architecture (PostgreSQL/Supabase) & Backend (Node.js/Express)
 */

const { Pool } = require('pg');
require('dotenv').config();

// Determine connection string from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/safex_billing_db';

// Configure PostgreSQL Pool with automatic SSL support for Supabase cloud
const poolConfig = {
    connectionString,
    max: 20, // Max clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// If connecting to Supabase / remote cloud, ensure SSL is configured
if (connectionString.includes('supabase') || connectionString.includes('amazonaws.com') || process.env.NODE_ENV === 'production') {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    // Client connected
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL Pool Error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
};
