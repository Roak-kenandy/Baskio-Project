const env = require('../config/env');
const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const auditService = require('./audit.service');
const { hashPassword, verifyPassword } = require('../utils/password');
const { resolvePermissions } = require('../constants/permissions');
const AppError = require('../utils/AppError');

const { AUDIT_ACTIONS } = auditService;

// Same message for unknown user, wrong password, locked and disabled accounts (no account enumeration).
const INVALID_CREDENTIALS = 'Invalid credentials, or the account is locked or disabled.';

function toSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    permissions: resolvePermissions(user),
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
  };
}

async function createSession(user, context) {
  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.issueRefreshToken(user.id, context);
  return { accessToken, refreshToken };
}

const authService = {
  toSessionUser,

  async login({ username, password }, context) {
    const user = await userRepository.findByUsernameWithSecrets(username);

    if (!user) {
      await verifyPassword(password, null);
      await auditService.record({
        actor: { username },
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        status: 'failure',
        metadata: { reason: 'unknown_user' },
        context,
      });
      throw new AppError(401, INVALID_CREDENTIALS, { code: 'INVALID_CREDENTIALS' });
    }

    const actor = { id: user.id, username: user.username };

    if (user.isLocked) {
      await auditService.record({ actor, action: AUDIT_ACTIONS.LOGIN_FAILURE, status: 'failure', metadata: { reason: 'locked' }, context });
      throw new AppError(401, INVALID_CREDENTIALS, { code: 'INVALID_CREDENTIALS' });
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);

    if (!passwordOk) {
      const attempts = await userRepository.incrementFailedLogin(user.id);
      if (attempts >= env.LOGIN_MAX_ATTEMPTS) {
        await userRepository.update(user.id, {
          lockUntil: new Date(Date.now() + env.LOGIN_LOCK_MINUTES * 60 * 1000),
          failedLoginAttempts: 0,
        });
        await auditService.record({ actor, action: AUDIT_ACTIONS.ACCOUNT_LOCKED, status: 'failure', metadata: { attempts }, context });
      }
      await auditService.record({ actor, action: AUDIT_ACTIONS.LOGIN_FAILURE, status: 'failure', metadata: { reason: 'bad_password' }, context });
      throw new AppError(401, INVALID_CREDENTIALS, { code: 'INVALID_CREDENTIALS' });
    }

    if (!user.isActive) {
      await auditService.record({ actor, action: AUDIT_ACTIONS.LOGIN_FAILURE, status: 'failure', metadata: { reason: 'disabled' }, context });
      throw new AppError(401, INVALID_CREDENTIALS, { code: 'INVALID_CREDENTIALS' });
    }

    const fresh = await userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: context.ip,
    });

    const tokens = await createSession(fresh, context);
    await auditService.record({ actor, action: AUDIT_ACTIONS.LOGIN_SUCCESS, context });
    return { user: toSessionUser(fresh), ...tokens };
  },

  async refresh(rawRefreshToken, context) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') throw new AppError(401, 'Not authenticated');

    let rotated;
    try {
      rotated = await tokenService.rotateRefreshToken(rawRefreshToken, context);
    } catch (error) {
      if (error.code === 'REFRESH_TOKEN_REUSED') {
        await auditService.record({
          actor: { id: error.userId },
          action: AUDIT_ACTIONS.REFRESH_TOKEN_REUSE,
          status: 'failure',
          context,
        });
      }
      throw error;
    }

    const user = await userRepository.findById(rotated.userId);
    if (!user || !user.isActive || user.isLocked) {
      await tokenService.revokeAllForUser(rotated.userId);
      throw new AppError(401, 'Not authenticated');
    }

    return {
      user: toSessionUser(user),
      accessToken: tokenService.signAccessToken(user),
      refreshToken: rotated.refreshToken,
    };
  },

  async logout(rawRefreshToken, context) {
    const revoked = await tokenService.revokeRefreshToken(rawRefreshToken);
    if (!revoked) return;
    const user = await userRepository.findById(revoked.userId);
    if (user) {
      await auditService.record({ actor: { id: user.id, username: user.username }, action: AUDIT_ACTIONS.LOGOUT, context });
    }
  },

  async changePassword(userId, { currentPassword, newPassword }, context) {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw new AppError(401, 'Not authenticated');

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new AppError(400, 'Current password is incorrect', { code: 'INVALID_PASSWORD' });
    if (await verifyPassword(newPassword, user.passwordHash)) {
      throw new AppError(400, 'New password must be different from the current password');
    }
    if (newPassword.toLowerCase().includes(user.username)) {
      throw new AppError(400, 'Password must not contain the username');
    }

    const updated = await userRepository.update(
      user.id,
      { passwordHash: await hashPassword(newPassword), mustChangePassword: false, passwordChangedAt: new Date() },
      { bumpTokenVersion: true }
    );

    // Sign out every other session, then start a fresh one for this browser.
    await tokenService.revokeAllForUser(user.id);
    const tokens = await createSession(updated, context);

    await auditService.record({
      actor: { id: user.id, username: user.username },
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      targetType: 'user',
      targetId: user.id,
      context,
    });

    return { user: toSessionUser(updated), ...tokens };
  },
};

module.exports = authService;
