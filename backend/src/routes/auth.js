const router = require('express').Router();
const c = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter, otpRequestLimiter } = require('../middleware/rateLimit');
const s = require('../validators/schemas');

router.post('/register', authLimiter, validate(s.registerSchema), c.register);
router.post('/login', authLimiter, validate(s.loginSchema), c.login);
router.post('/logout', c.logout);
router.get('/me', requireAuth, c.me);

router.post('/forgot', otpRequestLimiter, validate(s.forgotSchema), c.forgotPassword);
router.post('/verify-otp', authLimiter, validate(s.verifyOtpSchema), c.verifyOtp);
router.post('/reset', authLimiter, validate(s.resetSchema), c.resetPassword);

module.exports = router;
