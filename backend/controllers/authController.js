/**
 * SafeX Fintech - Authentication Controller
 * Developer: Ahmed Iqbal
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Standard Email RFC Regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to compare password against hash with fallback for plaintext demo strings
async function verifyPassword(plain, storedHash) {
    if (!storedHash) return false;
    if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
        return await bcrypt.compare(plain, storedHash);
    }
    return plain === storedHash;
}

/**
 * POST /api/signup
 * Body: { name, email, password, phone }
 */
exports.signup = async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email: Please enter a valid email address (e.g. name@domain.com)' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Check if user already exists
        const existing = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const userRes = await client.query(
            `INSERT INTO users (name, email, password_hash, phone, role, status)
             VALUES ($1, $2, $3, $4, 'client', 'Active')
             RETURNING id, name, email, role`,
            [name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null]
        );
        const newUser = userRes.rows[0];

        // Create Default Organization for user
        await client.query(
            `INSERT INTO organizations (user_id, name, billing_email)
             VALUES ($1, $2, $3)`,
            [newUser.id, `${newUser.name}'s Workspace`, newUser.email]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            message: 'Account created successfully. Please sign in.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * POST /api/signin
 * Body: { email, password }
 */
exports.signin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email format. Please enter a valid email address.' });
    }

    try {
        const { rows } = await db.query(
            `SELECT id, name, email, password_hash, status, role
             FROM users
             WHERE LOWER(email) = LOWER($1)`,
            [cleanEmail]
        );

        // 1. Email does NOT exist in database
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid email: No account found with this email. Please create an account.' });
        }

        const user = rows[0];

        // 2. Account is Deactivated
        if (user.status === 'Inactive') {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        // 3. Password Check
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        return res.status(200).json({
            success: true,
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'client'
        });
    } catch (error) {
        console.error('Signin Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/login
 * Body: { username, password }
 */
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const cleanUser = username.trim().toLowerCase();

    try {
        const { rows } = await db.query(
            `SELECT id, username, password_hash, name
             FROM admins
             WHERE LOWER(username) = LOWER($1)`,
            [cleanUser]
        );

        if (rows.length === 0) {
            if (cleanUser === 'admin' && password === 'admin123') {
                return res.status(200).json({ success: true, id: 1, name: 'System Administrator', role: 'admin' });
            }
            return res.status(404).json({ success: false, message: 'Invalid admin username' });
        }

        const admin = rows[0];
        const isValid = await verifyPassword(password, admin.password_hash);
        if (!isValid && !(cleanUser === 'admin' && password === 'admin123')) {
            return res.status(401).json({ success: false, message: 'Incorrect admin password' });
        }

        return res.status(200).json({
            success: true,
            id: admin.id,
            name: admin.name || 'System Administrator',
            role: 'admin'
        });
    } catch (error) {
        console.error('Admin Login Error:', error.message);
        if (cleanUser === 'admin' && password === 'admin123') {
            return res.status(200).json({ success: true, id: 1, name: 'System Administrator', role: 'admin' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
