/**
 * Database & Supabase Connectivity Verification Script
 * Run with: npm run test:db or node server/scripts/testConnection.js
 */

const db = require('../config/db');

async function testConnection() {
    console.log('🔍 Testing connection to PostgreSQL / Supabase Database...');
    const startTime = Date.now();

    try {
        const result = await db.query(`
            SELECT 
                current_database() AS database_name,
                current_user AS db_user,
                version() AS pg_version,
                NOW() AS server_time;
        `);

        const duration = Date.now() - startTime;
        console.log('✅ Connection Successful!');
        console.log(`⏱️  Query Latency: ${duration}ms`);
        console.log('📊 Database Details:', result.rows[0]);

        // Check if tables exist
        const tableCheck = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('\n📁 Detected Public Tables:');
        if (tableCheck.rows.length === 0) {
            console.log('⚠️  No tables found in public schema. Please run database/supabase_schema_and_seed.sql in Supabase SQL Editor.');
        } else {
            tableCheck.rows.forEach(r => console.log(`   - ${r.table_name}`));
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.log('\n💡 Tip: Check your DATABASE_URL in the .env file. For Supabase, use the connection string from:');
        console.log('   Supabase Dashboard -> Project Settings -> Database -> Connection String (URI)');
        process.exit(1);
    }
}

testConnection();
