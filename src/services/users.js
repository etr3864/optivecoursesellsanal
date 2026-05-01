const prisma = require('../db');
const { normalizePhone } = require('./phone');
const { generateToken } = require('./token');

function userError(message, status) {
  return Object.assign(new Error(message), { status });
}

async function listUsers({ search } = {}) {
  const where = search
    ? { OR: [{ phone: { contains: search } }, { name: { contains: search, mode: 'insensitive' } }] }
    : {};

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, phone: true, createdAt: true },
  });
}

async function createUser({ phone: rawPhone, name }) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw userError('מספר טלפון לא תקין', 400);

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) throw userError('משתמש כבר קיים', 409);

  return prisma.user.create({
    data: { phone, token: generateToken(), ...(name?.trim() ? { name: name.trim() } : {}) },
    select: { id: true, name: true, phone: true, createdAt: true },
  });
}

async function updateUser(id, { phone: rawPhone, name }) {
  const data = {};

  if (rawPhone !== undefined) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw userError('מספר טלפון לא תקין', 400);
    const conflict = await prisma.user.findFirst({ where: { phone, NOT: { id } } });
    if (conflict) throw userError('מספר טלפון כבר קיים', 409);
    data.phone = phone;
  }

  if (name !== undefined) data.name = name?.trim() || null;

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, phone: true, createdAt: true },
  });
}

async function deleteUser(id) {
  await prisma.$transaction([
    prisma.chapterView.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
}

async function deleteUsers(ids) {
  await prisma.$transaction([
    prisma.chapterView.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
}

module.exports = { listUsers, createUser, updateUser, deleteUser, deleteUsers };
