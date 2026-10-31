const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const PasswordReset = require('../models/PasswordReset');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { sendMail } = require('../utils/mailer');
const { generateOtp, hashOtp, otpMatches } = require('../utils/otp');
const {
  signSession,
  setSessionCookie,
  clearSessionCookie,
  signResetToken,
  verifyResetToken,
} = require('../utils/token');

const BCRYPT_ROUNDS = env.isTest ? 4 : 12;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Compared against when the phone number is unknown, so response time doesn't reveal which numbers exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password } = req.body;

  const [phoneTaken, emailTaken] = await Promise.all([User.exists({ phone }), User.exists({ email })]);
  const fields = {};
  if (phoneTaken) fields.phone = 'This phone number is already registered';
  if (emailTaken) fields.email = 'This email is already registered';
  if (Object.keys(fields).length) throw new HttpError(409, Object.values(fields)[0], fields);

  const user = await User.create({ name, phone, email, password: await bcrypt.hash(password, BCRYPT_ROUNDS) });
  try {
    await Wallet.create({ user: user._id });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // never leave a user without a wallet
    throw err;
  }

  setSessionCookie(res, signSession(user._id));
  res.status(201).json({ user: user.toPublic() });
});

const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone }).select('+password');
  const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // One message for both cases, so attackers can't probe which numbers are registered.
  if (!user || !passwordOk) throw new HttpError(401, 'Phone number or password is incorrect');

  setSessionCookie(res, signSession(user._id));
  res.json({ user: user.toPublic() });
});

const logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
};

const me = (req, res) => res.json({ user: req.user.toPublic() });

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const otp = generateOtp();
    await PasswordReset.findOneAndUpdate(
      { email },
      { otpHash: hashOtp(email, otp), attempts: 0, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      { upsert: true, setDefaultsOnInsert: true }
    );
    try {
      await sendMail({
        to: email,
        subject: 'Your VectorPay reset code',
        text: `Your VectorPay reset code is ${otp}. It expires in 10 minutes. If you didn't ask for it, ignore this email.`,
        html: `<p>Your VectorPay reset code is <strong style="font-size:20px;letter-spacing:2px">${otp}</strong>.</p><p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>`,
      });
    } catch (err) {
      console.error('Could not send reset email:', err.message);
    }
  }

  // Same response whether or not the account exists.
  res.json({ message: 'If that email has an account, we sent a 6-digit code.' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Counting the attempt atomically stops parallel guesses from sneaking past the limit.
  const record = await PasswordReset.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!record) throw new HttpError(400, 'That code is invalid or has expired');

  if (record.attempts > MAX_OTP_ATTEMPTS) {
    await PasswordReset.deleteOne({ _id: record._id });
    throw new HttpError(429, 'Too many wrong codes. Request a new one.');
  }
  if (!otpMatches(email, otp, record.otpHash)) throw new HttpError(400, 'That code is invalid or has expired');

  await PasswordReset.deleteOne({ _id: record._id }); // codes are single-use
  res.json({ resetToken: signResetToken(email) });
});

const resetPassword = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = verifyResetToken(req.body.resetToken);
  } catch {
    throw new HttpError(400, 'This reset session has expired. Start again.');
  }

  const user = await User.findOne({ email: payload.email }).select('+password');
  if (!user) throw new HttpError(400, 'This reset session has expired. Start again.');

  // A reset token can only be used once: it is older than the password it already changed.
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new HttpError(400, 'This reset session has already been used. Start again.');
  }

  user.password = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date(); // signs out every existing session
  await user.save();

  clearSessionCookie(res);
  res.json({ message: 'Password updated. Sign in with your new password.' });
});

module.exports = { register, login, logout, me, forgotPassword, verifyOtp, resetPassword };
