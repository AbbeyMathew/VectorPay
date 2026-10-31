const router = require('express').Router();
const { lookupByPhone } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { lookupLimiter } = require('../middleware/rateLimit');
const { lookupQuerySchema } = require('../validators/schemas');

router.get('/lookup', requireAuth, lookupLimiter, validate(lookupQuerySchema, 'query'), lookupByPhone);

module.exports = router;
