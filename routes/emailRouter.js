const express = require('express');
const { verifyEmail } = require('../controllers/authController');
const router = express.Router();

router.route('/:email/:token').get(verifyEmail);

module.exports = router;
