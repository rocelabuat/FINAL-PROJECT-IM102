const express = require('express');
const router = express.Router();
const { getDashboardTotals } = require('../controllers/orderController');

// GET /api/admin/dashboard-totals
router.get('/dashboard-totals', getDashboardTotals);

module.exports = router;
