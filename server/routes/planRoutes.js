/**
 * SafeX Fintech - Pricing Plans Routes
 */

const express = require('express');
const router = express.Router();
const planCtrl = require('../controllers/planController');

router.get('/', planCtrl.getPlans);
router.post('/', planCtrl.createPlan);
router.put('/:id', planCtrl.updatePlan);
router.delete('/:id', planCtrl.deletePlan);

module.exports = router;
