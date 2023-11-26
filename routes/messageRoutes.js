const express = require('express');
const { protect } = require('../controllers/authController');
const {
  sendMessage,
  fetchChatMessages,
} = require('../controllers/messageController');
const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, fetchChatMessages);

module.exports = router;
