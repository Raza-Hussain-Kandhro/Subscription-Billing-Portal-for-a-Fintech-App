/**
 * SafeX Fintech - Comprehensive SQA Test Suite
 * Executes 25+ automated test cases for Security, Edge Cases, ACID, Validation & Integrity
 */

const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

let testsPassed = 0;
let testsFailed = 0;
const issuesFound = [];

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : '';
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        if (payload) req.write(payload);
        req.end();
    });
}

async function assertTest(testName, condition, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        testsPassed++;
    } else {
        console.log(`  ❌ [FAIL] ${testName} -> ${details}`);
        testsFailed++;
        issuesFound.push({ testName, details });
    }
}

async function runQA() {
    console.log('===============================================================');
    console.log('🛡️  STARTING ENTERPRISE SQA & INTEGRITY TEST SUITE');
    console.log('===============================================================\n');

    // -------------------------------------------------------------
    // CATEGORY 1: HEALTH & CONFIGURATION
    // -------------------------------------------------------------
    console.log('📦 Category 1: Health & Base Infrastructure');
    const health = await request('GET', '/');
    assertTest('Health Check Returns 200', health.status === 200, `Got ${health.status}`);
    assertTest('Health Check Lists Endpoints', health.data && health.data.endpoints, 'Missing endpoints field');

    // -------------------------------------------------------------
    // CATEGORY 2: AUTHENTICATION & INPUT SANITIZATION
    // -------------------------------------------------------------
    console.log('\n🔒 Category 2: Authentication & Security Edge Cases');

    // Test 2.1: Missing Email in Signup
    const noEmail = await request('POST', '/api/signup', { name: 'Test', password: 'Password123' });
    assertTest('Signup Rejects Missing Email (400)', noEmail.status === 400, `Got ${noEmail.status}`);

    // Test 2.2: Short Password (< 6 chars)
    const shortPass = await request('POST', '/api/signup', { name: 'Test', email: `short_${Date.now()}@test.com`, password: '123' });
    assertTest('Signup Rejects Short Password (400)', shortPass.status === 400, `Got ${shortPass.status}`);

    // Test 2.3: Valid Signup
    const uniqueEmail = `sqa_user_${Date.now()}@fintechsafe.com`;
    const validSignup = await request('POST', '/api/signup', {
        name: '  QA Test User  ',
        email: `  ${uniqueEmail.toUpperCase()}  `,
        password: 'ValidSecurePass2026!',
        phone: '+92 300 9998877'
    });
    assertTest('Valid Signup Succeeds (201)', validSignup.status === 201 && validSignup.data.success, `Got status ${validSignup.status}`);
    const newUserId = validSignup.data?.id;

    // Test 2.4: Duplicate Email Signup (Must fail 409)
    const dupSignup = await request('POST', '/api/signup', {
        name: 'QA Test User 2',
        email: uniqueEmail.toLowerCase(),
        password: 'ValidSecurePass2026!'
    });
    assertTest('Duplicate Email Prevented (409 Conflict)', dupSignup.status === 409, `Got ${dupSignup.status}`);

    // Test 2.5: Case-Insensitive Signin with leading/trailing spaces
    const caseSignin = await request('POST', '/api/signin', {
        email: `   ${uniqueEmail.toLowerCase()}   `,
        password: 'ValidSecurePass2026!'
    });
    assertTest('Case-Insensitive Trimmed Signin (200)', caseSignin.status === 200 && caseSignin.data.id === newUserId, `Got status ${caseSignin.status}`);

    // Test 2.6: Wrong Password Signin (Must fail 401)
    const wrongPass = await request('POST', '/api/signin', {
        email: uniqueEmail,
        password: 'WrongPassword999!'
    });
    assertTest('Wrong Password Returns 401', wrongPass.status === 401, `Got ${wrongPass.status}`);

    // Test 2.7: Non-existent Email Signin (Must fail 401)
    const ghostSignin = await request('POST', '/api/signin', {
        email: 'nonexistent_ghost_user_999@domain.com',
        password: 'Password123!'
    });
    assertTest('Non-existent User Returns 401', ghostSignin.status === 401, `Got ${ghostSignin.status}`);

    // Test 2.8: Admin Authentication with Correct Credentials
    const adminLogin = await request('POST', '/api/admin/login', {
        username: 'admin',
        password: 'admin123'
    });
    assertTest('Admin Login Validated (200)', adminLogin.status === 200 && adminLogin.data.role === 'admin', `Got ${adminLogin.status}`);

    // Test 2.9: Admin Authentication with Wrong Credentials
    const badAdmin = await request('POST', '/api/admin/login', {
        username: 'admin',
        password: 'WrongAdminPassword!'
    });
    assertTest('Admin Rejects Wrong Password (401)', badAdmin.status === 401, `Got ${badAdmin.status}`);

    // -------------------------------------------------------------
    // CATEGORY 3: NEW USER SUBSCRIPTION LIFECYCLE & PRICING PLANS
    // -------------------------------------------------------------
    console.log('\n💳 Category 3: Subscription Lifecycle & ACID Safety');

    // Test 3.1: New User Initial Subscription Status (Must be Inactive / No Plan)
    const initialSub = await request('GET', `/api/subscriptions/${newUserId}`);
    assertTest('New User Initial Status is Inactive', initialSub.status === 200 && initialSub.data.planName === 'No Active Plan' && initialSub.data.status === 'Inactive', `Got ${JSON.stringify(initialSub.data)}`);

    // Test 3.2: Get All Active Plans
    const plansRes = await request('GET', '/api/plans');
    assertTest('Get Plans Returns Array (200)', Array.isArray(plansRes.data) && plansRes.data.length >= 3, `Count: ${plansRes.data?.length}`);

    // Test 3.3: User Activates Pro Plan (Plan ID 2, $29.00)
    const activatePro = await request('PUT', `/api/subscriptions/${newUserId}`, { planId: 2 });
    assertTest('Activate Pro Plan (200)', activatePro.status === 200 && activatePro.data.planName === 'Pro', `Got status ${activatePro.status}`);

    // Test 3.4: Verify Subscription Updated in Database
    const updatedSub = await request('GET', `/api/subscriptions/${newUserId}`);
    assertTest('Subscription is Now Active with Pro Plan', updatedSub.data.status === 'Active' && updatedSub.data.planId === 2 && updatedSub.data.amountDue === 29, `Got ${JSON.stringify(updatedSub.data)}`);

    // Test 3.5: User Invoice History Generated
    const invoices = await request('GET', `/api/invoices/${newUserId}`);
    assertTest('Invoice Generated on Plan Activation', Array.isArray(invoices.data) && invoices.data.length >= 1, `Invoice count: ${invoices.data?.length}`);

    // Test 3.6: User Upgrades to Premium Plan (Plan ID 3, $79.00)
    const upgradePremium = await request('PUT', `/api/subscriptions/${newUserId}`, { planId: 3 });
    assertTest('Upgrade to Premium Plan (200)', upgradePremium.status === 200 && upgradePremium.data.amountDue === 79, `Got ${upgradePremium.status}`);

    // Test 3.7: Invalid Plan ID Activation (Must fail 404)
    const invalidPlan = await request('PUT', `/api/subscriptions/${newUserId}`, { planId: 999999 });
    assertTest('Invalid Plan ID Returns 404', invalidPlan.status === 404, `Got ${invalidPlan.status}`);

    // -------------------------------------------------------------
    // CATEGORY 4: ADMIN PORTAL & REAL-TIME DATA SYNCHRONIZATION
    // -------------------------------------------------------------
    console.log('\n👥 Category 4: Admin Portal Synchronization');

    // Test 4.1: New Registered User Appears in Admin Client List
    const adminClients = await request('GET', '/api/admin/clients');
    const userInList = Array.isArray(adminClients.data) && adminClients.data.find(c => c.id === newUserId);
    assertTest('New User Present in Admin Clients List', !!userInList, `User ID ${newUserId} found: ${!!userInList}`);
    assertTest('User Reflects Active Plan in Admin List', userInList && userInList.plan === 'Premium', `Plan in list: ${userInList?.plan}`);

    // Test 4.2: Admin Deactivates User
    const deactRes = await request('PATCH', `/api/admin/clients/${newUserId}/status`, { status: 'Inactive' });
    assertTest('Admin Deactivates Client (200)', deactRes.status === 200, `Got ${deactRes.status}`);

    // Test 4.3: Deactivated User Cannot Sign In (Must return 403 Forbidden)
    const deactSignin = await request('POST', '/api/signin', {
        email: uniqueEmail,
        password: 'ValidSecurePass2026!'
    });
    assertTest('Deactivated User Blocked on Signin (403)', deactSignin.status === 403, `Got ${deactSignin.status}`);

    // Test 4.4: Admin Reactivates User
    const reactRes = await request('PATCH', `/api/admin/clients/${newUserId}/status`, { status: 'Active' });
    assertTest('Admin Reactivates Client (200)', reactRes.status === 200, `Got ${reactRes.status}`);

    // Test 4.5: Reactivated User Can Sign In Again
    const reactSignin = await request('POST', '/api/signin', {
        email: uniqueEmail,
        password: 'ValidSecurePass2026!'
    });
    assertTest('Reactivated User Can Sign In (200)', reactSignin.status === 200, `Got ${reactSignin.status}`);

    // Test 4.6: Admin Overview Stats
    const adminStats = await request('GET', '/api/admin/stats');
    assertTest('Admin Stats Returns Valid Counts & MRR', adminStats.status === 200 && adminStats.data.totalClients > 0 && adminStats.data.totalMrr > 0, `Stats: ${JSON.stringify(adminStats.data)}`);

    // -------------------------------------------------------------
    // CATEGORY 5: FINTECH METERED BILLING & MRR ENGINE
    // -------------------------------------------------------------
    console.log('\n📊 Category 5: Metered Usage & Financial MRR Engine');

    // Test 5.1: Record Metered Usage Event
    const usageRes = await request('POST', '/api/usage/record', {
        subscription_id: updatedSub.data.subscriptionId || 1,
        metric_type: 'api_calls',
        quantity_used: 5000,
        unit_price: 0.0001
    });
    assertTest('Metered Usage Event Recorded (201)', usageRes.status === 201 && usageRes.data.success, `Got ${usageRes.status}`);

    // Test 5.2: Financial MRR / ARR Analytics View
    const mrrRes = await request('GET', '/api/analytics/mrr');
    assertTest('MRR Analytics Calculation Active', mrrRes.status === 200 && mrrRes.data.summary.total_mrr > 0, `MRR: ${mrrRes.data.summary?.total_mrr}`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`📊 SQA TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
    console.log('===============================================================');

    if (testsFailed > 0) {
        console.log('\n⚠️ Issues to address:');
        issuesFound.forEach((iss, i) => console.log(`  ${i + 1}. ${iss.testName}: ${iss.details}`));
    } else {
        console.log('🎉 100% OF ALL 25+ SQA & SECURITY TEST CASES PASSED FLAWLESSLY!');
    }

    process.exit(testsFailed > 0 ? 1 : 0);
}

runQA();
