const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { message },
  });

const minutes = (n) => n * 60 * 1000;

module.exports = {
  apiLimiter: make(minutes(15), 600, 'Too many requests. Slow down and try again shortly.'),
  authLimiter: make(minutes(15), 30, 'Too many attempts. Try again in a few minutes.'),
  otpRequestLimiter: make(minutes(15), 5, 'Too many code requests. Try again in a few minutes.'),
  lookupLimiter: make(minutes(1), 40, 'Too many lookups. Wait a moment and try again.'),
};
