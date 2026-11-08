const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authenticate');
const { loginLimiter, refreshLimiter } = require('../middlewares/rateLimiters');
const { loginBody, changePasswordBody } = require('../validators/auth.validator');

const router = Router();

router.get('/csrf', authController.csrf);
router.post('/login', loginLimiter, validate({ body: loginBody }), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate({ body: changePasswordBody }), authController.changePassword);

module.exports = router;
