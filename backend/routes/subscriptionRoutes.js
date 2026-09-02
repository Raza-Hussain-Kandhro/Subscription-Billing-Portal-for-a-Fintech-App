/**
 * SafeX Fintech - Subscriptions Routes
 */

const express = require('express');
const router = express.Router();
const subCtrl = require('../controllers/subscriptionController');

router.get('/:userId', subCtrl.getSubscriptionByUserId);
router.put('/:userId', subCtrl.changePlan);

module.exports = router;
