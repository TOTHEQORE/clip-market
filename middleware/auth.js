const { load } = require('../lib/store');

function getUserFromRequest(req) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  const db = load();
  return db.users.find(u => u.token === token) || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = user;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: requires role ' + role });
    }
    next();
  };
}

module.exports = { getUserFromRequest, requireAuth, requireRole };
