const express = require('express');
const { param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { getMyReferrals, getReferredDetails } = require('../controllers/referralController');

const router = express.Router();

// Note: auth middleware is applied at mount level in server.js

router.get('/mine', getMyReferrals);
router.get('/referred/:userId', [param('userId').isMongoId()], validate, getReferredDetails);

module.exports = router;
