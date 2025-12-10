const express = require('express');
const router = express.Router();
const { lookupByPhone } = require('../controllers/userController');

router.get('/lookup', lookupByPhone);

module.exports = router;