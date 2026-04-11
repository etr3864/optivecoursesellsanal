function normalizePhone(raw) {
  if (!raw) return null;

  let digits = String(raw).replace(/\D/g, '');

  if (digits.startsWith('972')) digits = '0' + digits.slice(3);
  if (digits.startsWith('5')) digits = '0' + digits;

  if (!/^05\d{8}$/.test(digits)) return null;
  return digits;
}

module.exports = { normalizePhone };
