const express = require('express');
const router = express.Router();
const {
  getMonthlyReport,
  getDashboardSummary,
  getTopProducts,
  getModelSales,
  getActiveProducts,
} = require('../controllers/reportController');

router.get('/month/:year/:month', getMonthlyReport);
router.get('/top-products', getTopProducts);
router.get('/model-sales', getModelSales);
router.get('/active-products', getActiveProducts);

module.exports = router;