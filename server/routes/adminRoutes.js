/**
 * SafeX Fintech - Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

router.get('/clients', adminCtrl.getClients);
router.patch('/clients/:id/status', adminCtrl.updateClientStatus);
router.put('/clients/:id/deactivate', (req, res) => {
    req.body.status = 'Inactive';
    return adminCtrl.updateClientStatus(req, res);
});
router.get('/stats', adminCtrl.getAdminStats);

module.exports = router;
