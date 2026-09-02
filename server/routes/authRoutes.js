/**
 * SafeX Fintech - Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.post('/signup', authCtrl.signup);
router.post('/signin', authCtrl.signin);
router.post('/admin/login', authCtrl.adminLogin);

module.exports = router;
