const crypto = require('crypto');

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

/** API responses contain customer data: never let browsers or proxies cache them. */
function noStore(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

module.exports = { requestId, noStore };
