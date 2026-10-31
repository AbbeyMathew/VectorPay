/** Bare digits, with a leading +91 / 0 removed (mirrors the server). */
export function normalizePhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export const formatPhone = (digits) =>
  /^\d{10}$/.test(digits) ? `${digits.slice(0, 5)} ${digits.slice(5)}` : String(digits ?? '');

export const maskPhone = (digits) => (digits ? `•••• ${String(digits).slice(-4)}` : '');
