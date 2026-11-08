const { Router } = require('express');
const auditController = require('../controllers/audit.controller');
const validate = require('../middlewares/validate');
const { requirePermissions } = require('../middlewares/authorize');
const { PERMISSIONS } = require('../constants/permissions');
const { listAuditLogsQuery } = require('../validators/audit.validator');

const router = Router();

router.use(requirePermissions(PERMISSIONS.AUDIT_VIEW));

router.get('/', validate({ query: listAuditLogsQuery }), auditController.list);
router.get('/actions', auditController.actions);

module.exports = router;
