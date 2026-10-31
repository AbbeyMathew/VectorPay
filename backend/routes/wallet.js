const express = require('express'); 
const router = express.Router(); 
const auth = require('../middleware/authMiddleware'); 
const { getProfile, topup, transfer, transactions } = require('../controllers/walletController'); 

router.get('/me', auth, getProfile); 
router.post('/topup', auth, topup); 
router.post('/transfer', auth, transfer); 
router.get('/transactions', auth, transactions); 

module.exports = router;
