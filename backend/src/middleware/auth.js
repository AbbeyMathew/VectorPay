const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME, verifySession } = require('../utils/token');

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, 'Sign in to continue');

  let payload;
  try {
    payload = verifySession(token);
  } catch {
    throw new HttpError(401, 'Your session has expired. Sign in again.');
  }
  if (!payload.sub) throw new HttpError(401, 'Sign in to continue');

  // Always load the user so role changes and deletions take effect immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Sign in to continue');

  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new HttpError(401, 'Your password was changed. Sign in again.');
  }

  req.user = user;
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return next(new HttpError(403, 'Admin access required'));
  next();
};

module.exports = { requireAuth, requireAdmin };
