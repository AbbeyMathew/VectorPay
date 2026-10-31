/** Returns `tz` if it is a valid IANA zone (e.g. "Asia/Kolkata"), otherwise "UTC". */
function safeTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

module.exports = { safeTimeZone };
