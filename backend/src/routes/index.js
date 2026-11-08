const { Router } = require('express');
const { authenticate, requirePasswordChanged } = require('../middlewares/authenticate');
const metaController = require('../controllers/meta.controller');
const authRoutes = require('./auth.routes');
const reportRoutes = require('./report.routes');
const userRoutes = require('./user.routes');
const auditRoutes = require('./audit.routes');

const router = Router();

router.use('/auth', authRoutes);

const secured = Router();
secured.use(authenticate, requirePasswordChanged);
secured.get('/meta/permissions', metaController.permissions);
secured.get('/meta/reports', metaController.reports);
secured.use('/reports', reportRoutes);
secured.use('/users', userRoutes);
secured.use('/audit-logs', auditRoutes);

router.use(secured);

module.exports = router;
