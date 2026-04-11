const prisma = require('../db');

async function authToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { token } });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  req.user = user;
  next();
}

module.exports = authToken;
