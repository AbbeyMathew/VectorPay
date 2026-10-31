const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'vp_session';
const SESSION_DAYS = 7;

const signSession = (userId) =>
  jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: `${SESSION_DAYS}d` });

const verifySession = (token) => jwt.verify(token, env.jwtSecret);

/** httpOnly keeps the token out of reach of page scripts (XSS); SameSite=Lax blunts CSRF. */
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
  path: '/',
});

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

const clearSessionCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

/** Short-lived token proving the holder just passed OTP verification. */
const signResetToken = (email) =>
  jwt.sign({ email, purpose: 'password-reset' }, env.jwtSecret, { expiresIn: '10m' });

function verifyResetToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.purpose !== 'password-reset') throw new Error('Wrong token purpose');
  return payload;
}

module.exports = {
  COOKIE_NAME,
  signSession,
  verifySession,
  setSessionCookie,
  clearSessionCookie,
  signResetToken,
  verifyResetToken,
};
