/**
 * SafeX Fintech - Supabase / PostgreSQL Connection Pool
 * Developer: Ahmed Iqbal
 * Role: Database Architecture (PostgreSQL/Supabase) & Backend (Node.js/Express)
 */

const { Pool } = require('pg');
require('dotenv').config();

// Live Supabase Cloud PostgreSQL Connection String (Mumbai Session Pooler - port 5432)
const SUPABASE_CLOUD_URL = 'postgresql://postgres.ynxfweijibptgxuskvmt:SafeX%40Billing2026%21@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

// Determine connection string from environment or use live Supabase
const connectionString = process.env.DATABASE_URL || SUPABASE_CLOUD_URL;

// Configure PostgreSQL Pool with automatic SSL support for Supabase cloud
const poolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('❌ Supabase PostgreSQL Pool Error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
};
