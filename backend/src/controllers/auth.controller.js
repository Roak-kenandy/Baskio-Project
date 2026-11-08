const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { contextFrom } = require('../services/audit.service');
const { issueCsrfToken } = require('../middlewares/csrf');
const { COOKIE_NAMES, setSessionCookies, clearSessionCookies } = require('../utils/cookies');
const AppError = require('../utils/AppError');

const authController = {
  csrf(req, res) {
    const existing = req.cookies?.[COOKIE_NAMES.csrf];
    const csrfToken = existing && /^[A-Za-z0-9_-]{43}$/.test(existing) ? existing : issueCsrfToken(res);
    res.json({ csrfToken });
  },

  async login(req, res) {
    const result = await authService.login(req.validated.body, contextFrom(req));
    setSessionCookies(res, result);
    const csrfToken = issueCsrfToken(res);
    res.json({ user: result.user, csrfToken });
  },

  async refresh(req, res) {
    try {
      const result = await authService.refresh(req.cookies?.[COOKIE_NAMES.refresh], contextFrom(req));
      setSessionCookies(res, result);
      res.json({ user: result.user });
    } catch (error) {
      clearSessionCookies(res);
      throw error;
    }
  },

  async logout(req, res) {
    await authService.logout(req.cookies?.[COOKIE_NAMES.refresh], contextFrom(req));
    clearSessionCookies(res);
    res.status(204).end();
  },

  async me(req, res) {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new AppError(401, 'Not authenticated');
    res.json({ user: authService.toSessionUser(user) });
  },

  async changePassword(req, res) {
    const result = await authService.changePassword(req.user.id, req.validated.body, contextFrom(req));
    setSessionCookies(res, result);
    res.json({ user: result.user });
  },
};

module.exports = authController;
