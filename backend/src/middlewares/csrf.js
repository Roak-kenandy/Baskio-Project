const crypto = require('crypto');
const { COOKIE_NAMES, setCsrfCookie } = require('../utils/cookies');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function tokensMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Double-submit cookie check on every state-changing request (in addition to SameSite=Strict). */
function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[COOKIE_NAMES.csrf];
  const headerToken = req.get('x-csrf-token');
  if (!tokensMatch(cookieToken, headerToken)) {
    return next(new AppError(403, 'Invalid or missing CSRF token', { code: 'CSRF_INVALID' }));
  }
  return next();
}

/** Issues a new CSRF token (used at bootstrap and rotated on login to prevent fixation). */
function issueCsrfToken(res) {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  return token;
}

module.exports = { csrfProtection, issueCsrfToken };
