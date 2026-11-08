function maskPhone(value) {
  if (!value) return value;
  const text = String(value);
  if (text.length <= 3) return '*'.repeat(text.length);
  return `${text.slice(0, 1)}${'*'.repeat(text.length - 3)}${text.slice(-2)}`;
}

function maskEmail(value) {
  if (!value) return value;
  const text = String(value);
  const at = text.indexOf('@');
  if (at < 1) return '*'.repeat(text.length);
  return `${text[0]}***${text.slice(at)}`;
}

module.exports = { maskPhone, maskEmail };
