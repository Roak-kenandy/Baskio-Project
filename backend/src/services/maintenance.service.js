const env = require('../config/env');
const logger = require('../utils/logger');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const auditLogRepository = require('../repositories/auditLog.repository');

const INTERVAL_MS = 60 * 60 * 1000;

async function purgeExpiredData() {
  try {
    const cutoff = new Date(Date.now() - env.AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const [tokens, logs] = await Promise.all([
      refreshTokenRepository.deleteExpired(),
      auditLogRepository.deleteOlderThan(cutoff),
    ]);
    if (tokens || logs) logger.info({ tokens, logs }, 'Purged expired sessions and old audit logs');
  } catch (error) {
    logger.error({ err: error }, 'Maintenance purge failed');
  }
}

/** Hourly clean-up of expired refresh tokens and audit logs past the retention period. */
function startMaintenance() {
  purgeExpiredData();
  return setInterval(purgeExpiredData, INTERVAL_MS).unref();
}

module.exports = { startMaintenance, purgeExpiredData };
