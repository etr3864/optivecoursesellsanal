const express = require('express');
const authToken = require('../middleware/authToken');
const prisma = require('../db');

const router = express.Router();

const SIGNED_URL_TTL_SECONDS = 2 * 60 * 60;

function buildSignedUrl(videoId) {
  // Bunny Stream signed URL format
  // In dev with placeholder videoId we return a simple embed URL
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!libraryId || !videoId) return null;
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=false`;
}

router.get('/', authToken, async (req, res) => {
  const [chapters, views] = await Promise.all([
    prisma.chapter.findMany({ orderBy: { number: 'asc' } }),
    prisma.chapterView.findMany({ where: { userId: req.user.id }, select: { chapterId: true } }),
  ]);

  const viewedSet = new Set(views.map((v) => v.chapterId));

  const result = chapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    shortName: ch.shortName,
    fullName: ch.fullName,
    description: ch.description,
    videoUrl: buildSignedUrl(ch.videoUrl),
    attachments: ch.attachments,
    viewed: viewedSet.has(ch.id),
  }));

  res.json(result);
});

module.exports = router;
