const express = require('express');
const router = express.Router();
const { load, save } = require('../lib/store');
const { hashPassword, verifyPassword, createToken } = require('../lib/auth');
const { getUserFromRequest } = require('../middleware/auth');

function publicUser(user) {
  const { passwordHash, token, ...rest } = user;
  return rest;
}

router.post('/register', (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name and role are required' });
  }
  if (role !== 'brand' && role !== 'creator') {
    return res.status(400).json({ error: 'role must be "brand" or "creator"' });
  }
  const db = load();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }
  const user = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    email,
    name,
    role,
    passwordHash: hashPassword(password),
    token: null,
    balance: 0,
    createdAt: new Date().toISOString()
  };
  user.token = createToken(user.id);
  db.users.push(user);
  save(db);
  res.cookie('token', user.token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = load();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  user.token = createToken(user.id);
  save(db);
  res.cookie('token', user.token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
