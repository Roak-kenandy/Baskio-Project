const env = require('../config/env');
const auditService = require('../services/audit.service');
const { dayBoundary } = require('../utils/dates');

const auditController = {
  async list(req, res) {
    const { from, to, ...rest } = req.validated.query;
    res.json(
      await auditService.list({
        ...rest,
        from: from ? dayBoundary(from, env.REPORT_TIMEZONE) : undefined,
        to: to ? dayBoundary(to, env.REPORT_TIMEZONE, true) : undefined,
      })
    );
  },

  actions(_req, res) {
    res.json({ actions: auditService.listActions() });
  },
};

module.exports = auditController;
