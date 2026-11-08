/** Escapes LIKE wildcards so user search text is matched literally. */
function likeContains(value) {
  return `%${String(value).replace(/[\\%_]/g, '\\$&')}%`;
}

function likePrefix(value) {
  return `${String(value).replace(/[\\%_]/g, '\\$&')}%`;
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { likeContains, likePrefix, parseJson };
