const crypto = require('crypto');

const adminSessions = new Set();

function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.add(token);
  return token;
}

function destroyAdminSession(token) {
  if (token) adminSessions.delete(token);
}

function adminAuth(req, res, next) {
  const token = req.cookies?.admin_session;
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { adminAuth, createAdminSession, destroyAdminSession };
