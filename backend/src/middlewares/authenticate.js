const tokenService = require('../services/token.service');
const userRepository = require('../repositories/user.repository');
const { resolvePermissions } = require('../constants/permissions');
const { COOKIE_NAMES } = require('../utils/cookies');
const AppError = require('../utils/AppError');

/**
 * Validates the access-token cookie and reloads the user on every request so
 * disabling a user or changing their permissions takes effect immediately.
 */
async function authenticate(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAMES.access];
  if (!token || typeof token !== 'string') throw new AppError(401, 'Not authenticated');

  const payload = tokenService.verifyAccessToken(token);
  const user = await userRepository.findById(payload.sub);

  if (!user || !user.isActive || user.isLocked || user.tokenVersion !== payload.tv) {
    throw new AppError(401, 'Session is no longer valid', { code: 'SESSION_REVOKED' });
  }

  req.user = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    permissions: resolvePermissions(user),
    mustChangePassword: user.mustChangePassword,
  };
  next();
}

/** Blocks everything except the auth endpoints until a temporary password has been changed. */
function requirePasswordChanged(req, _res, next) {
  if (req.user?.mustChangePassword) {
    throw new AppError(403, 'You must change your password before continuing', { code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  next();
}

module.exports = { authenticate, requirePasswordChanged };
