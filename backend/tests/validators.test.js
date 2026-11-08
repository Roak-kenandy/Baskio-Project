const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.DB_NAME ??= 'test';
process.env.DB_USER ??= 'test';
process.env.DB_PASSWORD ??= 'test';
process.env.CRM_MONGO_URI ??= 'mongodb://localhost:27017/crm';
process.env.JWT_ACCESS_SECRET ??= 'x'.repeat(64);
process.env.NODE_ENV = 'test';

const { password } = require('../src/validators/common');
const { reportQuery } = require('../src/validators/report.validator');
const { createUserBody } = require('../src/validators/user.validator');
const { resolvePermissions, PERMISSIONS, ALL_PERMISSIONS } = require('../src/constants/permissions');

test('password policy', () => {
  assert.equal(password.safeParse('Short1!').success, false);
  assert.equal(password.safeParse('alllowercase123!').success, false);
  assert.equal(password.safeParse('NoSymbolsHere123').success, false);
  assert.equal(password.safeParse('Str0ng&Secure!Pass').success, true);
});

test('report query applies defaults and rejects bad input', () => {
  const parsed = reportQuery.parse({ search: '' });
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 25);
  assert.equal(parsed.search, undefined);
  assert.equal(parsed.sortBy, 'endDate');

  assert.equal(reportQuery.safeParse({ limit: '1000' }).success, false);
  assert.equal(reportQuery.safeParse({ state: '{"$ne":1}' }).success, false);
  assert.equal(reportQuery.safeParse({ startFrom: '2026-10-10', startTo: '2026-10-01' }).success, false);
  assert.equal(reportQuery.safeParse({ sortBy: '$where' }).success, false);
});

test('create user rejects unknown permissions and strips unknown fields', () => {
  const base = { username: 'Jane.Doe', fullName: 'Jane Doe', password: 'Str0ng&Secure!Pass' };
  assert.equal(createUserBody.safeParse({ ...base, permissions: ['root'] }).success, false);
  const parsed = createUserBody.parse({ ...base, isActive: false, passwordHash: 'x' });
  assert.equal(parsed.username, 'jane.doe');
  assert.equal(parsed.passwordHash, undefined);
  assert.equal(parsed.role, 'user');
});

test('admins implicitly receive every permission; users only valid granted ones', () => {
  assert.deepEqual(resolvePermissions({ role: 'admin', permissions: [] }), ALL_PERMISSIONS);
  assert.deepEqual(
    resolvePermissions({ role: 'user', permissions: [PERMISSIONS.REPORT_OTT_VIEW, 'bogus'] }),
    [PERMISSIONS.REPORT_OTT_VIEW]
  );
});
