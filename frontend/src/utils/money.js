const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export const MIN_AMOUNT = 100;
export const MAX_TOPUP = 10000000;
export const MAX_TRANSFER = 5000000;

export const formatINR = (paise) => inr.format((Number(paise) || 0) / 100);

export function splitINR(paise) {
  const [whole, fraction = '00'] = formatINR(paise).split('.');
  return [whole, fraction];
}

export function parseRupees(input) {
  const text = String(input ?? '').trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(paise) ? paise : null;
}

export function checkAmount(input, max) {
  if (!String(input ?? '').trim()) return { error: 'Enter an amount' };
  const paise = parseRupees(input);
  if (paise === null) return { error: 'Enter a valid amount, like 250 or 250.50' };
  if (paise < MIN_AMOUNT) return { error: `The minimum is ${formatINR(MIN_AMOUNT)}` };
  if (paise > max) return { error: `The maximum is ${formatINR(max)}` };
  return { paise };
}
