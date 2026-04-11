const express = require('express');
const { PrismaClient } = require('@prisma/client');
const apiKey = require('../middleware/apiKey');
const { normalizePhone } = require('../services/phone');
const { generateToken } = require('../services/token');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/create', apiKey, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'מספר טלפון לא תקין' });

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: 'משתמש כבר קיים' });

  await prisma.user.create({
    data: { phone, token: generateToken() },
  });

  res.json({ success: true, phone });
});

module.exports = router;
