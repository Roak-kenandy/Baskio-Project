const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const AppError = require('../utils/AppError');

const JWT_ALGORITHM = 'HS256';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('base64url');
}

const tokenService = {
  hashToken,

  signAccessToken(user) {
    return jwt.sign({ tv: user.tokenVersion }, env.JWT_ACCESS_SECRET, {
      algorithm: JWT_ALGORITHM,
      subject: String(user.id),
      expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      jwtid: crypto.randomUUID(),
    });
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError(401, 'Session expired', { code: 'TOKEN_EXPIRED' });
      }
      throw new AppError(401, 'Invalid session');
    }
  },

  async issueRefreshToken(userId, context, family = crypto.randomUUID()) {
    const token = generateOpaqueToken();
    await refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(token),
      family,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_HOURS * 60 * 60 * 1000),
      createdByIp: context.ip,
      userAgent: context.userAgent,
    });
    return token;
  },

  /**
   * Rotates a refresh token. Presenting an already-rotated token means it was
   * stolen or replayed, so the whole token family is revoked.
   */
  async rotateRefreshToken(rawToken, context) {
    const tokenHash = hashToken(rawToken);
    const existing = await refreshTokenRepository.findByHash(tokenHash);
    if (!existing) throw new AppError(401, 'Invalid session');

    if (existing.revokedAt) {
      await refreshTokenRepository.revokeFamily(existing.family);
      const error = new AppError(401, 'Invalid session', { code: 'REFRESH_TOKEN_REUSED' });
      error.userId = existing.userId;
      throw error;
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new AppError(401, 'Session expired', { code: 'TOKEN_EXPIRED' });
    }

    const nextToken = generateOpaqueToken();
    const revoked = await refreshTokenRepository.revokeIfActive(tokenHash, hashToken(nextToken));
    if (!revoked) throw new AppError(401, 'Invalid session');

    await refreshTokenRepository.create({
      userId: existing.userId,
      tokenHash: hashToken(nextToken),
      family: existing.family,
      // The family keeps its original absolute expiry: refreshing cannot extend a session forever.
      expiresAt: existing.expiresAt,
      createdByIp: context.ip,
      userAgent: context.userAgent,
    });

    return { userId: existing.userId, refreshToken: nextToken };
  },

  async revokeRefreshToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    return refreshTokenRepository.revokeIfActive(hashToken(rawToken));
  },

  revokeAllForUser(userId) {
    return refreshTokenRepository.revokeAllForUser(userId);
  },
};

module.exports = tokenService;
