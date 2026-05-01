const express = require('express');
const rateLimit = require('express-rate-limit');
const { adminAuth, createAdminSession, destroyAdminSession } = require('../middleware/adminAuth');
const { listUsers, createUser, updateUser, deleteUser, deleteUsers } = require('../services/users');

const router = express.Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי ניסיונות, נסה שוב בעוד 15 דקות' },
});

const ADMIN_COOKIE_BASE = { httpOnly: true, sameSite: 'strict', path: '/' };

router.post('/login', adminLoginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'פרטים שגויים' });
  }

  const sessionToken = createAdminSession();
  res.cookie('admin_session', sessionToken, {
    ...ADMIN_COOKIE_BASE,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  }).json({ success: true });
});

router.post('/logout', (req, res) => {
  destroyAdminSession(req.cookies?.admin_session);
  res.clearCookie('admin_session', { path: '/' }).json({ success: true });
});

router.get('/me', adminAuth, (req, res) => res.json({ ok: true }));

router.get('/users', adminAuth, async (req, res) => {
  const users = await listUsers({ search: req.query.search });
  res.json(users);
});

router.post('/users', adminAuth, async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/users/bulk-delete', adminAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'נדרש לפחות מזהה אחד' });
  }
  try {
    await deleteUsers(ids);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
