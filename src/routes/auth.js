const express = require('express');
const { loginLimiter } = require('../middleware/rateLimiter');
const authToken = require('../middleware/authToken');
const { normalizePhone } = require('../services/phone');
const { sendWebhook } = require('../services/webhook');
const prisma = require('../db');

const router = express.Router();

const GENERIC_ERROR = { error: 'הפרטים שהוזנו אינם נכונים' };
const LOGIN_DELAY_MS = 500;

router.post('/login', loginLimiter, async (req, res) => {
  const { name } = req.body;
  const phone = normalizePhone(req.body.phone);

  await new Promise((r) => setTimeout(r, LOGIN_DELAY_MS));

  if (!phone || !name?.trim()) {
    return res.status(401).json(GENERIC_ERROR);
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return res.status(401).json(GENERIC_ERROR);

  const isFirstLogin = user.name === null;

  if (isFirstLogin) {
    await prisma.user.update({
      where: { phone },
      data: { name: name.trim() },
    });

    sendWebhook(process.env.WEBHOOK_URL_NEW_USER, {
      event: 'new_login',
      name: name.trim(),
      phone,
      timestamp: new Date().toISOString(),
    });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  res.cookie('token', user.token, cookieOptions).json({ success: true });
});

router.get('/me', authToken, (req, res) => {
  res.json({ name: req.user.name, phone: req.user.phone });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' }).json({ success: true });
});

module.exports = router;
