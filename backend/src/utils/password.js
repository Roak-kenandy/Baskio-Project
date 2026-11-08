const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');

// Used to keep login timing constant when the username does not exist.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), env.BCRYPT_ROUNDS);

function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH);
}

function generateStrongPassword(length = 20) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
  const all = sets.join('');
  const chars = sets.map((set) => set[crypto.randomInt(set.length)]);
  while (chars.length < length) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

module.exports = { hashPassword, verifyPassword, generateStrongPassword };
