/**
 * SafeX Fintech - Metered Usage & Financial Analytics Routes
 */

const express = require('express');
const router = express.Router();
const usageCtrl = require('../controllers/usageController');

router.post('/record', usageCtrl.recordUsage);
router.get('/mrr', usageCtrl.getMrrAnalytics);

module.exports = router;
