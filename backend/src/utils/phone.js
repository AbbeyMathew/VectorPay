/** Strips formatting and a leading country/trunk prefix, returning bare digits. */
function normalizePhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

const isValidPhone = (digits) => /^\d{10}$/.test(digits);

module.exports = { normalizePhone, isValidPhone };
