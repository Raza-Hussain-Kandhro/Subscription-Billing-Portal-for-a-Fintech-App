/**
 * SafeX Fintech - Pricing Plans Controller
 * Developer: Ahmed Iqbal
 */

const db = require('../config/db');

/**
 * GET /api/plans
 * Returns list of active plans
 */
exports.getPlans = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, plan_code, name, price, billing_interval, features, description, 
                    max_team_seats, monthly_api_credit_limit, is_active
             FROM pricing_plans
             WHERE is_active = true
             ORDER BY price ASC;`
        );

        // Map numeric price to float
        const plans = rows.map(p => ({
            ...p,
            price: parseFloat(p.price)
        }));

        return res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/plans
 * Body: { name, price, features, description }
 */
exports.createPlan = async (req, res) => {
    const { name, price, features = [], description = '' } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ success: false, message: 'Plan name and price are required' });
    }

    try {
        const planCode = name.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
        const featuresArray = Array.isArray(features) ? features : features.split(',').map(f => f.trim());

        const { rows } = await db.query(
            `INSERT INTO pricing_plans (plan_code, name, price, features, description, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id, name, price, features, description, is_active`,
            [planCode, name, price, featuresArray, description]
        );

        const newPlan = rows[0];
        return res.status(201).json({
            ...newPlan,
            price: parseFloat(newPlan.price)
        });
    } catch (error) {
        console.error('Error creating plan:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/plans/:id
 * Body: { name, price, features, description }
 */
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, price, features, description } = req.body;

    try {
        const featuresArray = features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim())) : null;

        const { rows } = await db.query(
            `UPDATE pricing_plans
             SET name = COALESCE($1, name),
                 price = COALESCE($2, price),
                 features = COALESCE($3, features),
                 description = COALESCE($4, description)
             WHERE id = $5
             RETURNING id, name, price, features, description, is_active`,
            [name, price, featuresArray, description, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const updated = rows[0];
        return res.status(200).json({
            ...updated,
            price: parseFloat(updated.price)
        });
    } catch (error) {
        console.error('Error updating plan:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/plans/:id
 */
exports.deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        const { rows } = await db.query(
            `UPDATE pricing_plans SET is_active = false WHERE id = $1 RETURNING id`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        return res.status(200).json({ success: true, id: parseInt(id), message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
