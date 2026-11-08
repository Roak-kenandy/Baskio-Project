const crypto = require('crypto');
const { getPool } = require('../config/database');
const { ROLES } = require('../constants/permissions');
const { likeContains, parseJson } = require('../utils/sql');

// camelCase field -> column. Only these may be written through update().
const WRITABLE_COLUMNS = Object.freeze({
  fullName: 'full_name',
  email: 'email',
  passwordHash: 'password_hash',
  role: 'role',
  permissions: 'permissions',
  isActive: 'is_active',
  mustChangePassword: 'must_change_password',
  failedLoginAttempts: 'failed_login_attempts',
  lockUntil: 'lock_until',
  passwordChangedAt: 'password_changed_at',
  lastLoginAt: 'last_login_at',
  lastLoginIp: 'last_login_ip',
});

function toDbValue(field, value) {
  if (field === 'permissions') return JSON.stringify(value ?? []);
  if (field === 'isActive' || field === 'mustChangePassword') return value ? 1 : 0;
  if (field === 'email') return value || null;
  return value;
}

function mapUser(row, { withSecrets = false } = {}) {
  if (!row) return null;
  const lockUntil = row.lock_until ? new Date(row.lock_until) : null;
  const user = {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email ?? undefined,
    role: row.role,
    permissions: parseJson(row.permissions, []),
    isActive: Boolean(row.is_active),
    mustChangePassword: Boolean(row.must_change_password),
    lockUntil,
    isLocked: Boolean(lockUntil && lockUntil.getTime() > Date.now()),
    tokenVersion: row.token_version,
    passwordChangedAt: row.password_changed_at ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    lastLoginIp: row.last_login_ip ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (withSecrets) {
    user.passwordHash = row.password_hash;
    user.failedLoginAttempts = row.failed_login_attempts;
  }
  return user;
}

/** Shape safe to send to the browser. */
function toPublicUser(user) {
  if (!user) return null;
  const { tokenVersion, passwordHash, failedLoginAttempts, ...rest } = user;
  return rest;
}

async function selectOne(where, params, options) {
  const [rows] = await getPool().execute(`SELECT * FROM users WHERE ${where} LIMIT 1`, params);
  return mapUser(rows[0], options);
}

const userRepository = {
  toPublicUser,

  findById(id) {
    return selectOne('id = ?', [id]);
  },

  findByIdWithSecrets(id) {
    return selectOne('id = ?', [id], { withSecrets: true });
  },

  findByUsernameWithSecrets(username) {
    return selectOne('username = ?', [username], { withSecrets: true });
  },

  async existsByUsername(username) {
    const [rows] = await getPool().execute('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
    return rows.length > 0;
  },

  async create(data) {
    const id = crypto.randomUUID();
    await getPool().execute(
      `INSERT INTO users
        (id, username, full_name, email, password_hash, role, permissions, must_change_password, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.username,
        data.fullName,
        data.email || null,
        data.passwordHash,
        data.role,
        JSON.stringify(data.permissions ?? []),
        data.mustChangePassword === false ? 0 : 1,
        data.createdBy ?? null,
      ]
    );
    return this.findById(id);
  },

  async list({ page, limit, search }) {
    const conditions = [];
    const params = [];
    if (search) {
      const like = likeContains(search);
      conditions.push('(username LIKE ? OR full_name LIKE ? OR email LIKE ?)');
      params.push(like, like, like);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const pool = getPool();
    const [[rows], [[{ total }]]] = await Promise.all([
      pool.query(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params),
    ]);
    return { items: rows.map((row) => mapUser(row)), total: Number(total) };
  },

  async countActiveAdmins(excludeId) {
    const params = [ROLES.ADMIN];
    let sql = 'SELECT COUNT(*) AS total FROM users WHERE role = ? AND is_active = 1';
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    const [[{ total }]] = await getPool().execute(sql, params);
    return Number(total);
  },

  /**
   * Updates whitelisted fields. `bumpTokenVersion` invalidates every access token
   * already issued to the user (password reset, disable, password change).
   */
  async update(id, changes, { bumpTokenVersion = false } = {}) {
    const sets = [];
    const params = [];
    for (const [field, value] of Object.entries(changes)) {
      const column = WRITABLE_COLUMNS[field];
      if (!column || value === undefined) continue;
      sets.push(`${column} = ?`);
      params.push(toDbValue(field, value));
    }
    if (bumpTokenVersion) sets.push('token_version = token_version + 1');
    if (sets.length) {
      await getPool().execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.findById(id);
  },

  /** Atomically increments and returns the failed-attempt counter. */
  async incrementFailedLogin(id) {
    const pool = getPool();
    await pool.execute('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [id]);
    const [[row]] = await pool.execute('SELECT failed_login_attempts FROM users WHERE id = ?', [id]);
    return row ? row.failed_login_attempts : 0;
  },

  async deleteById(id) {
    await getPool().execute('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = userRepository;
