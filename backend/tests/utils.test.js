const { test } = require('node:test');
const assert = require('node:assert/strict');
const { escapeCsvCell, toCsvRow } = require('../src/utils/csv');
const { maskPhone, maskEmail } = require('../src/utils/mask');
const { dayBoundary, formatDay, isValidDateString } = require('../src/utils/dates');
const { escapeRegex } = require('../src/utils/regex');

test('csv escapes quotes, commas and newlines', () => {
  assert.equal(escapeCsvCell('a,b'), '"a,b"');
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(toCsvRow(['x', 1]), 'x,1\r\n');
});

test('csv neutralises formula injection', () => {
  assert.equal(escapeCsvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(escapeCsvCell('+960'), "'+960");
  assert.equal(escapeCsvCell('@SUM'), "'@SUM");
});

test('masks phone numbers and emails', () => {
  assert.equal(maskPhone('7771234'), '7****34');
  assert.equal(maskEmail('john@medianet.mv'), 'j***@medianet.mv');
  assert.equal(maskPhone(undefined), undefined);
});

test('day boundaries respect the report timezone (Maldives is UTC+5)', () => {
  assert.equal(dayBoundary('2026-10-27', 'Indian/Maldives').toISOString(), '2026-10-26T19:00:00.000Z');
  assert.equal(dayBoundary('2026-10-27', 'Indian/Maldives', true).toISOString(), '2026-10-27T18:59:59.999Z');
  assert.equal(formatDay(new Date('2026-10-26T20:00:00Z'), 'Indian/Maldives'), '27-Oct-2026');
});

test('validates calendar dates strictly', () => {
  assert.equal(isValidDateString('2026-02-28'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('27-10-2026'), false);
});

test('escapes regex metacharacters from user search input', () => {
  const rx = new RegExp(escapeRegex('a.*(b)'));
  assert.equal(rx.test('a.*(b)'), true);
  assert.equal(rx.test('aXXb'), false);
});
