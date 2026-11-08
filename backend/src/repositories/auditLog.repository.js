const { getPool } = require('../config/database');
const { likePrefix, parseJson } = require('../utils/sql');

function mapLog(row) {
  return {
    id: String(row.id),
    actorUsername: row.actor_username ?? undefined,
    action: row.action,
    status: row.status,
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    ip: row.ip ?? undefined,
    userAgent: row.user_agent ?? undefined,
    metadata: parseJson(row.metadata, undefined),
    createdAt: row.created_at,
  };
}

const auditLogRepository = {
  async create(entry) {
    await getPool().execute(
      `INSERT INTO audit_logs
        (actor_id, actor_username, action, status, target_type, target_id, ip, user_agent, request_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.actor ?? null,
        entry.actorUsername?.slice(0, 50) ?? null,
        entry.action,
        entry.status,
        entry.targetType ?? null,
        entry.targetId?.slice(0, 64) ?? null,
        entry.ip ?? null,
        entry.userAgent?.slice(0, 512) ?? null,
        entry.requestId ?? null,
        entry.metadata === undefined ? null : JSON.stringify(entry.metadata),
      ]
    );
  },

  async list({ page, limit, action, username, status, from, to }) {
    const conditions = [];
    const params = [];
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (username) {
      conditions.push('actor_username LIKE ?');
      params.push(likePrefix(username));
    }
    if (from) {
      conditions.push('created_at >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('created_at <= ?');
      params.push(to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pool = getPool();
    const [[rows], [[{ total }]]] = await Promise.all([
      pool.query(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [
        ...params,
        limit,
        (page - 1) * limit,
      ]),
      pool.query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params),
    ]);
    return { items: rows.map(mapLog), total: Number(total) };
  },

  async deleteOlderThan(cutoff) {
    const [result] = await getPool().execute('DELETE FROM audit_logs WHERE created_at < ?', [cutoff]);
    return result.affectedRows;
  },
};

module.exports = auditLogRepository;
