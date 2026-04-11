const express = require('express');
const authToken = require('../middleware/authToken');
const { sendWebhook } = require('../services/webhook');
const prisma = require('../db');

const router = express.Router();

router.post('/', authToken, async (req, res) => {
  const { chapterId } = req.body;
  if (!chapterId) return res.status(400).json({ error: 'chapterId נדרש' });

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return res.status(404).json({ error: 'פרק לא נמצא' });

  const existing = await prisma.chapterView.findUnique({
    where: { userId_chapterId: { userId: req.user.id, chapterId } },
  });

  if (existing) return res.json({ success: true, alreadyViewed: true });

  const view = await prisma.chapterView.create({
    data: { userId: req.user.id, chapterId },
  });

  const sent = await sendWebhook(process.env.WEBHOOK_URL_CHAPTER_VIEW, {
    event: 'chapter_viewed',
    name: req.user.name,
    phone: req.user.phone,
    chapterNumber: chapter.number,
    chapterName: chapter.shortName,
    timestamp: new Date().toISOString(),
  });

  if (sent) {
    await prisma.chapterView.update({
      where: { id: view.id },
      data: { webhookSent: true },
    });
  }

  res.json({ success: true, alreadyViewed: false });
});

module.exports = router;
