const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashVerify;
}

function createToken(userId) {
  const random = crypto.randomBytes(24).toString('hex');
  return userId + '.' + random;
}

function tokenUserId(token) {
  if (!token) return null;
  return token.split('.')[0];
}

module.exports = { hashPassword, verifyPassword, createToken, tokenUserId };
