const env = require('../config/env');
const { PERMISSION_CATALOG, ROLES } = require('../constants/permissions');
const reportService = require('../services/report.service');

const metaController = {
  permissions(_req, res) {
    res.json({ permissions: PERMISSION_CATALOG, roles: Object.values(ROLES) });
  },

  reports(req, res) {
    res.json({ reports: reportService.listAvailable(req.user), timezone: env.REPORT_TIMEZONE });
  },
};

module.exports = metaController;
