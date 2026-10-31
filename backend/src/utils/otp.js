const crypto = require('crypto');
const env = require('../config/env');

/** Cryptographically secure 6-digit code. */
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

/** Codes are stored hashed, so a database leak does not expose live codes. */
function hashOtp(email, otp) {
  return crypto.createHmac('sha256', env.jwtSecret).update(`${email}:${otp}`).digest('hex');
}

function otpMatches(email, otp, expectedHash) {
  const a = Buffer.from(hashOtp(email, otp));
  const b = Buffer.from(String(expectedHash));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { generateOtp, hashOtp, otpMatches };
