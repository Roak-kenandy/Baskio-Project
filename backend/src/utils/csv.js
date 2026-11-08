const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection.
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsvRow(values) {
  return `${values.map(escapeCsvCell).join(',')}\r\n`;
}

module.exports = { escapeCsvCell, toCsvRow };
