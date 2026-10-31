const router = require('express').Router();
const c = require('../controllers/walletController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(requireAuth);

router.get('/', c.getWallet);
router.post('/topup', validate(s.topUpSchema), c.topUp);
router.post('/transfer', validate(s.transferSchema), c.transfer);
router.get('/transactions', validate(s.transactionsQuerySchema, 'query'), c.listTransactions);
router.get('/spend/daily', validate(s.dateRangeSchema, 'query'), c.dailySpend);
router.get('/summary', validate(s.dateRangeSchema, 'query'), c.summary);

module.exports = router;
