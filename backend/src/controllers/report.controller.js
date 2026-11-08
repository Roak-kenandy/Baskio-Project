const reportService = require('../services/report.service');
const { contextFrom } = require('../services/audit.service');

const reportController = {
  async summary(req, res) {
    res.json(await reportService.getSummary(req.user));
  },

  async list(req, res) {
    const { type } = req.validated.params;
    res.json(await reportService.getSubscriptions(type, req.validated.query, req.user, contextFrom(req)));
  },

  async states(req, res) {
    res.json({ states: await reportService.getStates(req.validated.params.type, req.user) });
  },

  async exportCsv(req, res) {
    const { type } = req.validated.params;
    await reportService.exportSubscriptions(type, req.validated.query, req.user, contextFrom(req), res);
  },
};

module.exports = reportController;
