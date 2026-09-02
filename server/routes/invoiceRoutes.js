/**
 * SafeX Fintech - Invoice Routes
 */

const express = require('express');
const router = express.Router();
const invCtrl = require('../controllers/invoiceController');

router.get('/', invCtrl.getAllInvoices);
router.get('/:userId', invCtrl.getInvoicesByUserId);

module.exports = router;
