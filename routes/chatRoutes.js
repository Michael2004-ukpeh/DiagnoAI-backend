const express = require('express');
const { getAllChats } = require('../controllers/chatController');
const { protect } = require('../controllers/authController');
const { getUserOwn } = require('../middlewares/chatMiddleware');
const router = express.Router();

router.route('/').get(protect, getUserOwn, getAllChats);

module.exports = router;
