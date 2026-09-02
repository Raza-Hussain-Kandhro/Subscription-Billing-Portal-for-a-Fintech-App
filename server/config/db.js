/**
 * SafeX Fintech - Supabase / PostgreSQL Connection Pool
 * Developer: Ahmed Iqbal
 * Role: Database Architecture (PostgreSQL/Supabase) & Backend (Node.js/Express)
 */

const { Pool } = require('pg');
require('dotenv').config();

// Live Supabase Cloud PostgreSQL Connection String
const SUPABASE_CLOUD_URL = 'postgresql://postgres.ynxfweijibptgxuskvmt:SafeX%40Billing2026%21@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

// Determine connection string from environment or use live Supabase
const connectionString = process.env.DATABASE_URL || SUPABASE_CLOUD_URL;

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
