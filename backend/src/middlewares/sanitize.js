const FORBIDDEN_KEY = /^\$|\.|^__proto__$|^constructor$|^prototype$/;

function clean(value, depth = 0) {
  if (depth > 10) return undefined;
  if (Array.isArray(value)) return value.map((item) => clean(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (!FORBIDDEN_KEY.test(key)) out[key] = clean(inner, depth + 1);
    }
    return out;
  }
  return value;
}

/** Drops Mongo operator keys and prototype-pollution keys from JSON bodies. */
function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
}

module.exports = sanitizeBody;
