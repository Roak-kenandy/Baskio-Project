const auditLogRepository = require('../repositories/auditLog.repository');
const logger = require('../utils/logger');

const AUDIT_ACTIONS = Object.freeze({
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  ACCOUNT_LOCKED: 'auth.account.locked',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password.changed',
  REFRESH_TOKEN_REUSE: 'auth.refresh.reuse_detected',
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_PASSWORD_RESET: 'user.password.reset',
  USER_UNLOCKED: 'user.unlocked',
});

/** Builds the request context recorded with every audit entry. */
function contextFrom(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 512),
    requestId: req.id,
  };
}

const auditService = {
  AUDIT_ACTIONS,
  contextFrom,

  /** Never throws: an audit failure must not break the user's request. */
  async record({ actor, action, status = 'success', targetType, targetId, metadata, context = {} }) {
    try {
      await auditLogRepository.create({
        actor: actor?.id ?? null,
        actorUsername: actor?.username,
        action,
        status,
        targetType,
        targetId: targetId ? String(targetId) : undefined,
        metadata,
        ...context,
      });
    } catch (error) {
      logger.error({ err: error, action }, 'Failed to write audit log');
    }
  },

  async list(query) {
    const { items, total } = await auditLogRepository.list(query);
    return { items, total, page: query.page, limit: query.limit };
  },

  listActions() {
    return Object.values(AUDIT_ACTIONS).sort();
  },
};

module.exports = auditService;
