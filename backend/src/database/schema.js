/**
 * Idempotent schema for the application's own data (users, sessions, audit trail).
 * Applied automatically at startup and by scripts/create-admin.js.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id                    CHAR(36)      NOT NULL,
    username              VARCHAR(50)   NOT NULL,
    full_name             VARCHAR(100)  NOT NULL,
    email                 VARCHAR(254)  NULL,
    password_hash         VARCHAR(100)  NOT NULL,
    role                  ENUM('admin','user') NOT NULL DEFAULT 'user',
    permissions           JSON          NOT NULL,
    is_active             TINYINT(1)    NOT NULL DEFAULT 1,
    must_change_password  TINYINT(1)    NOT NULL DEFAULT 1,
    failed_login_attempts INT UNSIGNED  NOT NULL DEFAULT 0,
    lock_until            DATETIME(3)   NULL,
    token_version         INT UNSIGNED  NOT NULL DEFAULT 0,
    password_changed_at   DATETIME(3)   NULL,
    last_login_at         DATETIME(3)   NULL,
    last_login_ip         VARCHAR(45)   NULL,
    created_by            CHAR(36)      NULL,
    created_at            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    KEY idx_users_role_active (role, is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          CHAR(36)     NOT NULL,
    token_hash       CHAR(64)     NOT NULL,
    family           CHAR(36)     NOT NULL,
    expires_at       DATETIME(3)  NOT NULL,
    revoked_at       DATETIME(3)  NULL,
    replaced_by_hash CHAR(64)     NULL,
    created_by_ip    VARCHAR(45)  NULL,
    user_agent       VARCHAR(512) NULL,
    created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_tokens_hash (token_hash),
    KEY idx_refresh_tokens_user (user_id),
    KEY idx_refresh_tokens_family (family),
    KEY idx_refresh_tokens_expires (expires_at),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_id       CHAR(36)     NULL,
    actor_username VARCHAR(50)  NULL,
    action         VARCHAR(60)  NOT NULL,
    status         ENUM('success','failure') NOT NULL DEFAULT 'success',
    target_type    VARCHAR(30)  NULL,
    target_id      VARCHAR(64)  NULL,
    ip             VARCHAR(45)  NULL,
    user_agent     VARCHAR(512) NULL,
    request_id     VARCHAR(64)  NULL,
    metadata       JSON         NULL,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_audit_created (created_at),
    KEY idx_audit_action_created (action, created_at),
    KEY idx_audit_actor_created (actor_username, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function applySchema(pool) {
  for (const statement of STATEMENTS) {
    // eslint-disable-next-line no-await-in-loop
    await pool.query(statement);
  }
}

module.exports = { applySchema };
