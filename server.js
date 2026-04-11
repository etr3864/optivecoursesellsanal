require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { sendWebhook } = require('./src/services/webhook');
const logger = require('./src/utils/logger');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/chapters', require('./src/routes/chapters'));
app.use('/api/views', require('./src/routes/views'));

app.get('/course', (req, res) => res.sendFile(path.join(__dirname, 'public', 'course.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/accessibility', (req, res) => res.sendFile(path.join(__dirname, 'public', 'accessibility.html')));

startSafetyNetScanner();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

function startSafetyNetScanner() {
  const INTERVAL_MS = 5 * 60 * 1000;
  const MAX_RETRIES = 10;

  setInterval(async () => {
    const pending = await prisma.chapterView.findMany({
      where: { webhookSent: false, retryCount: { lt: MAX_RETRIES } },
      include: { user: true, chapter: true },
    });

    for (const view of pending) {
      const sent = await sendWebhook(process.env.WEBHOOK_URL_CHAPTER_VIEW, {
        event: 'chapter_viewed',
        name: view.user.name,
        phone: view.user.phone,
        chapterNumber: view.chapter.number,
        chapterName: view.chapter.shortName,
        timestamp: view.viewedAt.toISOString(),
      });

      await prisma.chapterView.update({
        where: { id: view.id },
        data: sent
          ? { webhookSent: true }
          : { retryCount: { increment: 1 } },
      });

      if (!sent) {
        logger.warn('Safety net retry failed', { viewId: view.id, retryCount: view.retryCount + 1 });
      }
    }
  }, INTERVAL_MS);
}
