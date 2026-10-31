const router = require('express').Router();
const c = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { adminUsersQuerySchema } = require('../validators/schemas');

router.use(requireAuth, requireAdmin);

router.get('/stats', c.stats);
router.get('/users', validate(adminUsersQuerySchema, 'query'), c.listUsers);

module.exports = router;
