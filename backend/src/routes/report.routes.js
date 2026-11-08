const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const validate = require('../middlewares/validate');
const { requirePermissions } = require('../middlewares/authorize');
const { exportLimiter } = require('../middlewares/rateLimiters');
const { PERMISSIONS } = require('../constants/permissions');
const { reportParams, reportQuery, exportQuery } = require('../validators/report.validator');

const router = Router();

router.get('/summary', reportController.summary);
router.get('/subscriptions/:type', validate({ params: reportParams, query: reportQuery }), reportController.list);
router.get('/subscriptions/:type/states', validate({ params: reportParams }), reportController.states);
router.get(
  '/subscriptions/:type/export',
  requirePermissions(PERMISSIONS.REPORT_EXPORT),
  exportLimiter,
  validate({ params: reportParams, query: exportQuery }),
  reportController.exportCsv
);

module.exports = router;
