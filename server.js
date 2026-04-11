require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const prisma = require('./src/db');
const { sendWebhook } = require('./src/services/webhook');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));
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

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

function startSafetyNetScanner() {
  const INTERVAL_MS = 5 * 60 * 1000;
  const MAX_RETRIES = 10;

  setInterval(async () => {
    try {
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
    } catch (err) {
      logger.error('Safety net scanner error', { error: err.message });
    }
  }, INTERVAL_MS);
}

async function shutdown() {
  logger.info('Shutting down...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
