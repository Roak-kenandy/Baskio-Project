const { getPool } = require('../config/database');

function mapToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    family: row.family,
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  };
}

const refreshTokenRepository = {
  async create({ userId, tokenHash, family, expiresAt, createdByIp, userAgent }) {
    await getPool().execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at, created_by_ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, tokenHash, family, expiresAt, createdByIp ?? null, userAgent?.slice(0, 512) ?? null]
    );
  },

  async findByHash(tokenHash) {
    const [rows] = await getPool().execute('SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1', [tokenHash]);
    return mapToken(rows[0]);
  },

  /** Revokes a token only if it is still active; returns null if another request already used it. */
  async revokeIfActive(tokenHash, replacedByHash = null) {
    const [result] = await getPool().execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP(3), replaced_by_hash = ? WHERE token_hash = ? AND revoked_at IS NULL',
      [replacedByHash, tokenHash]
    );
    return result.affectedRows === 1 ? this.findByHash(tokenHash) : null;
  },

  async revokeFamily(family) {
    await getPool().execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP(3) WHERE family = ? AND revoked_at IS NULL',
      [family]
    );
  },

  async revokeAllForUser(userId) {
    await getPool().execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  },

  async deleteExpired() {
    const [result] = await getPool().execute('DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP(3)');
    return result.affectedRows;
  },
};

module.exports = refreshTokenRepository;
