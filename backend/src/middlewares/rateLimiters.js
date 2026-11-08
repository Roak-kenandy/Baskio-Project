const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const common = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' },
    });
  },
};

const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});

// Keyed on IP + username so one attacker cannot lock many accounts and one account
// cannot be brute-forced from many IPs faster than the account lockout allows.
const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.toLowerCase().slice(0, 50) : '';
    return `${ipKeyGenerator(req.ip)}|${username}`;
  },
});

const refreshLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 120,
});

const exportLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `export|${req.user?.id ?? ipKeyGenerator(req.ip)}`,
});

module.exports = { apiLimiter, loginLimiter, refreshLimiter, exportLimiter };
