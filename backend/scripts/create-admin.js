/* eslint-disable no-console */
/**
 * Creates the first administrator (and the MySQL tables if they do not exist yet).
 *   npm run create-admin -- --username admin --name "System Administrator" [--email admin@medianet.mv]
 * A strong temporary password is generated and printed once; it must be changed at first login.
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const env = require('../src/config/env');
const { applySchema } = require('../src/database/schema');
const { ROLES } = require('../src/constants/permissions');
const { hashPassword, generateStrongPassword } = require('../src/utils/password');
const { username: usernameSchema } = require('../src/validators/common');

function readArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function main() {
  const username = usernameSchema.parse(readArg('username') || 'admin');
  const fullName = readArg('name') || 'System Administrator';
  const email = readArg('email') || null;

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
    timezone: 'Z',
  });

  try {
    await applySchema(connection);

    const [existing] = await connection.execute('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing.length) {
      console.error(`User "${username}" already exists. Nothing changed.`);
      process.exitCode = 1;
      return;
    }

    const password = generateStrongPassword();
    await connection.execute(
      `INSERT INTO users (id, username, full_name, email, password_hash, role, permissions, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, '[]', 1)`,
      [crypto.randomUUID(), username, fullName, email, await hashPassword(password), ROLES.ADMIN]
    );

    console.log('\nAdministrator created.');
    console.log(`  Username:           ${username}`);
    console.log(`  Temporary password: ${password}`);
    console.log('\nStore it securely. You will be asked to change it at first login.\n');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Failed to create administrator:', error.message);
  process.exitCode = 1;
});
