const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/reportController');

router.get('/summary', getDashboardSummary);

module.exports = router;
