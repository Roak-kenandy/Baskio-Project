const env = require('../config/env');

const API_AUTH_PATH = '/api/v1/auth';

// __Host- / __Secure- prefixes make browsers refuse cookies that are not Secure
// (and, for __Host-, scoped to another domain or path). Only usable over HTTPS.
const hostPrefix = env.COOKIE_SECURE ? '__Host-' : '';
const securePrefix = env.COOKIE_SECURE ? '__Secure-' : '';

const COOKIE_NAMES = Object.freeze({
  access: `${hostPrefix}bsk_at`,
  refresh: `${securePrefix}bsk_rt`,
  csrf: `${hostPrefix}bsk_csrf`,
});

const base = {
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
};

function setSessionCookies(res, { accessToken, refreshToken }) {
  res.cookie(COOKIE_NAMES.access, accessToken, {
    ...base,
    httpOnly: true,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  });
  res.cookie(COOKIE_NAMES.refresh, refreshToken, {
    ...base,
    httpOnly: true,
    path: API_AUTH_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  });
}

function clearSessionCookies(res) {
  res.clearCookie(COOKIE_NAMES.access, { ...base, httpOnly: true, path: '/' });
  res.clearCookie(COOKIE_NAMES.refresh, { ...base, httpOnly: true, path: API_AUTH_PATH });
}

function setCsrfCookie(res, token) {
  res.cookie(COOKIE_NAMES.csrf, token, {
    ...base,
    httpOnly: false,
    path: '/',
    maxAge: env.REFRESH_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  });
}

module.exports = { COOKIE_NAMES, setSessionCookies, clearSessionCookies, setCsrfCookie };
